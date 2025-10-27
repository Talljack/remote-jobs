import axios from "axios";
import { eq, and } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// Remotive API
const REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs";

// API Rate Limits: Max 2 requests per minute, recommended 4 times per day
// Jobs are delayed by 24 hours

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags?: string[];
  job_type: string; // full_time, part_time, contract, internship
  location?: string;
  candidate_required_location?: string;
  salary?: string;
  description: string;
  publication_date: string;
}

interface RemotiveApiResponse {
  "0-legal-notice": string;
  "job-count": number;
  jobs: RemotiveJob[];
}

/**
 * Map Remotive job type to our job type
 */
function mapJobType(jobType: string): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  const type = jobType.toLowerCase();

  if (type.includes("part")) return "PART_TIME";
  if (type.includes("contract") || type.includes("freelance")) return "CONTRACT";
  if (type.includes("intern")) return "INTERNSHIP";

  return "FULL_TIME";
}

/**
 * Parse salary string to min/max values
 * Examples: "$50k-$80k", "$100,000 - $150,000", "€60k - €80k"
 */
function parseSalary(salaryStr?: string): {
  min: number | null;
  max: number | null;
  currency: string;
} {
  if (!salaryStr) return { min: null, max: null, currency: "USD" };

  // Extract currency
  const currencyMatch = salaryStr.match(/[$€£¥]/);
  const currency = currencyMatch ? (currencyMatch[0] === "$" ? "USD" : "EUR") : "USD";

  // Extract numbers
  const numbers = salaryStr.match(/\d+[,.]?\d*/g);

  if (!numbers || numbers.length === 0) {
    return { min: null, max: null, currency };
  }

  // Parse numbers (remove commas, multiply by 1000 if 'k' is present, round to integer)
  const parsedNumbers = numbers.map((num) => {
    let value = parseFloat(num.replace(/,/g, ""));
    if (salaryStr.toLowerCase().includes("k")) {
      value *= 1000;
    }
    return Math.round(value);
  });

  if (parsedNumbers.length === 1) {
    return { min: parsedNumbers[0], max: null, currency };
  }

  return {
    min: Math.min(...parsedNumbers),
    max: Math.max(...parsedNumbers),
    currency,
  };
}

/**
 * Map Remotive category to our category
 */
async function getCategoryFromRemotiveCategory(category: string): Promise<string | null> {
  const categoryMapping: Record<string, string> = {
    // Engineering - General
    "software dev": "engineering.backend",
    "software development": "engineering.backend",
    engineering: "engineering.backend",
    // Frontend
    frontend: "engineering.frontend",
    react: "engineering.frontend.react",
    vue: "engineering.frontend.vue",
    angular: "engineering.frontend.angular",
    // Backend
    backend: "engineering.backend",
    nodejs: "engineering.backend.nodejs",
    node: "engineering.backend.nodejs",
    python: "engineering.backend.python",
    java: "engineering.backend.java",
    golang: "engineering.backend.go",
    go: "engineering.backend.go",
    // Other Engineering
    "full-stack": "engineering.fullstack",
    mobile: "engineering.mobile",
    devops: "engineering.devops",
    qa: "engineering.qa",
    security: "engineering.security",
    blockchain: "engineering.blockchain",
    web3: "engineering.blockchain",
    // Data
    "data science": "data.science",
    "data scientist": "data.science",
    "data engineer": "data.engineer",
    "data analyst": "data.analyst",
    // AI/ML
    "machine learning": "ml.ai",
    ai: "ml.ai",
    "ai engineer": "ml.ai.engineer",
    "ai agent": "ml.ai.agent",
    agent: "ml.ai.agent",
    llm: "ml.ai.llm",
    "computer vision": "ml.ai.vision",
    nlp: "ml.ai.nlp",
    mlops: "ml.ai.mlops",
    // Product & Design
    product: "product.manager",
    design: "product.designer",
    ux: "ux.designer",
    ui: "ui.designer",
    // Business
    marketing: "business.marketing",
    sales: "business.sales",
    "customer support": "business.customer_support",
    "customer success": "business.customer_success",
    // Other
    writing: "other.content",
  };

  const normalizedCategory = category.toLowerCase();
  const categorySlug = categoryMapping[normalizedCategory];

  if (categorySlug) {
    const [cat] = await db
      .select()
      .from(jobCategories)
      .where(eq(jobCategories.slug, categorySlug))
      .limit(1);

    if (cat) return cat.id;
  }

  return null;
}

/**
 * Extract experience level from title and description
 */
function extractExperienceLevel(
  title: string,
  description: string
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("principal") || text.includes("distinguished")) return "PRINCIPAL";
  if (text.includes("staff")) return "STAFF";
  if (text.includes("lead") || text.includes("head of")) return "LEAD";
  if (text.includes("senior") || text.includes("sr.")) return "SENIOR";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) return "ENTRY";
  if (text.includes("mid-level") || text.includes("intermediate")) return "MID";

  return null;
}

/**
 * Extract skills from description and tags
 */
function extractSkills(description: string, tags?: string[]): string[] {
  const commonSkills = [
    // Frontend
    "JavaScript",
    "TypeScript",
    "React",
    "Vue.js",
    "Vue",
    "Angular",
    "Next.js",
    "Svelte",
    // Backend
    "Node.js",
    "Python",
    "Django",
    "Flask",
    "FastAPI",
    "Java",
    "Spring",
    "Go",
    "Golang",
    "Rust",
    "Ruby",
    "Rails",
    "PHP",
    "Laravel",
    "C++",
    "C#",
    ".NET",
    "Swift",
    "Kotlin",
    // AI/ML
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "Keras",
    "scikit-learn",
    "LLM",
    "GPT",
    "OpenAI",
    "Langchain",
    "RAG",
    "NLP",
    "Computer Vision",
    "MLOps",
    // Cloud & Infrastructure
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    // Databases
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Elasticsearch",
    // APIs
    "GraphQL",
    "REST",
    "gRPC",
    // Blockchain
    "Solidity",
    "Web3",
    "Ethereum",
  ];

  const foundSkills: Set<string> = new Set();
  const lowerDescription = description.toLowerCase();

  // Add skills from description
  for (const skill of commonSkills) {
    if (lowerDescription.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  // Add tags as skills
  if (tags) {
    for (const tag of tags) {
      if (tag && tag.length > 1) {
        foundSkills.add(tag);
      }
    }
  }

  return Array.from(foundSkills).slice(0, 10); // Max 10 skills
}

/**
 * Get or create skill
 */
async function getOrCreateSkill(skillName: string): Promise<string> {
  const skillSlug = slugify(skillName);

  let [skill] = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);

  if (!skill) {
    [skill] = await db
      .insert(skills)
      .values({
        name: skillName,
        slug: skillSlug,
        count: 1,
      })
      .returning();
  } else {
    await db
      .update(skills)
      .set({ count: skill.count + 1 })
      .where(eq(skills.id, skill.id));
  }

  return skill.id;
}

/**
 * Crawl Remotive remote jobs
 * Note: Should only be called max 4 times per day due to rate limits
 */
export async function crawlRemotive(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching jobs from Remotive API...");

    const response = await axios.get<RemotiveApiResponse>(REMOTIVE_API_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "RemoteJobs-Aggregator/1.0",
      },
      timeout: 15000,
    });

    const allJobs = response.data.jobs || [];
    console.log(`Fetched ${allJobs.length} jobs from Remotive`);

    // Filter jobs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = allJobs.filter((job) => {
      const publishDate = new Date(job.publication_date);
      return publishDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        const sourceUrl = jobData.url;

        // Check if job already exists
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        // Get category
        const categoryId = await getCategoryFromRemotiveCategory(jobData.category);

        // Parse salary
        const { min: salaryMin, max: salaryMax, currency } = parseSalary(jobData.salary);

        // Extract experience level
        const experienceLevel = extractExperienceLevel(jobData.title, jobData.description);

        // Map job type
        const jobType = mapJobType(jobData.job_type);

        // Determine location
        const location = jobData.candidate_required_location || jobData.location || "Worldwide";

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.title,
            companyName: jobData.company_name,
            companyLogo: jobData.company_logo || null,
            type: jobType,
            remoteType: "FULLY_REMOTE",
            location,
            description: jobData.description,
            applyMethod: sourceUrl,
            source: "REMOTIVE",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.publication_date),
            salaryMin,
            salaryMax,
            salaryCurrency: currency,
            categoryId,
            experienceLevel,
          })
          .returning();

        // Extract and add skills
        const detectedSkills = extractSkills(jobData.description, jobData.tags);
        for (const skillName of detectedSkills) {
          try {
            const skillId = await getOrCreateSkill(skillName);

            // Check if relation already exists
            const [existingRelation] = await db
              .select()
              .from(jobSkillRelations)
              .where(
                and(eq(jobSkillRelations.jobId, newJob.id), eq(jobSkillRelations.skillId, skillId))
              )
              .limit(1);

            if (!existingRelation) {
              await db.insert(jobSkillRelations).values({
                jobId: newJob.id,
                skillId,
              });
            }
          } catch (error) {
            console.warn(`Failed to add skill ${skillName}:`, error);
          }
        }

        successCount++;
      } catch (error) {
        console.error("Error saving Remotive job:", error);
        failCount++;
      }
    }

    console.log(`Remotive crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling Remotive:", error);
    throw error;
  }
}
