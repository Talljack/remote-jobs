import axios from "axios";
import { eq, and } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// Remote-friendly companies using Greenhouse
const GREENHOUSE_COMPANIES = [
  "gitlab",
  "grammarly",
  "stripe",
  "coinbase",
  "robinhood",
  "doordash",
  "instacart",
  "airtable",
  "asana",
  "canva",
  "discord",
  "duolingo",
  "figma",
  "zapier",
  "automattic",
  "hashicorp",
  "mozilla",
  "shopify",
  "square",
  "twilio",
];

const REMOTE_KEYWORDS = ["remote", "worldwide", "anywhere", "distributed", "work from home", "wfh"];

interface GreenhouseLocation {
  name: string;
}

interface GreenhouseDepartment {
  id: number;
  name: string;
  child_ids?: number[];
  parent_id?: number | null;
}

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: GreenhouseLocation;
  updated_at: string;
  company_name: string;
  first_published: string;
  internal_job_id: number;
  requisition_id?: string;
  content?: string;
  departments?: GreenhouseDepartment[];
}

interface GreenhouseJobsResponse {
  jobs: GreenhouseJob[];
}

/**
 * Check if a job is remote based on location
 */
function isRemoteJob(location: string): boolean {
  const lowerLocation = location.toLowerCase();
  return REMOTE_KEYWORDS.some((keyword) => lowerLocation.includes(keyword));
}

/**
 * Determine job type from title and content
 */
function mapJobType(
  title: string,
  content?: string
): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  const text = `${title} ${content || ""}`.toLowerCase();

  if (text.includes("intern")) return "INTERNSHIP";
  if (text.includes("part-time") || text.includes("part time")) return "PART_TIME";
  if (text.includes("contract") || text.includes("freelance")) return "CONTRACT";

  return "FULL_TIME";
}

/**
 * Determine experience level from title
 */
function mapExperienceLevel(
  title: string
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("junior") || lowerTitle.includes("entry")) return "ENTRY";
  if (lowerTitle.includes("senior") || lowerTitle.includes("sr.") || lowerTitle.includes("sr "))
    return "SENIOR";
  if (lowerTitle.includes("lead") || lowerTitle.includes("head")) return "LEAD";
  if (lowerTitle.includes("staff")) return "STAFF";
  if (lowerTitle.includes("principal")) return "PRINCIPAL";
  if (
    lowerTitle.includes("mid-level") ||
    lowerTitle.includes("mid level") ||
    lowerTitle.includes("intermediate")
  )
    return "MID";

  return null;
}

/**
 * Get category from department name and job title
 */
async function getCategoryFromJob(
  title: string,
  departments?: GreenhouseDepartment[]
): Promise<string | null> {
  const text = `${title} ${departments?.map((d) => d.name).join(" ")}`.toLowerCase();

  const categoryMapping: Record<string, string> = {
    // Engineering
    "software engineer": "engineering",
    backend: "engineering.backend",
    frontend: "engineering.frontend",
    "full stack": "engineering.fullstack",
    fullstack: "engineering.fullstack",
    mobile: "engineering.mobile",
    ios: "engineering.mobile",
    android: "engineering.mobile",
    devops: "engineering.devops",
    sre: "engineering.devops",
    qa: "engineering.qa",
    test: "engineering.qa",
    security: "engineering.security",
    blockchain: "engineering.blockchain",
    web3: "engineering.blockchain",
    // Data & ML
    "data engineer": "data.engineer",
    "data scientist": "data.science",
    "data analyst": "data.analyst",
    "machine learning": "ml.ai",
    "ml engineer": "ml.ai.engineer",
    "ai engineer": "ml.ai.engineer",
    // Product & Design
    "product manager": "product.manager",
    "product designer": "product.designer",
    ux: "ux.designer",
    ui: "ui.designer",
    // Business
    marketing: "business.marketing",
    sales: "business.sales",
    "account executive": "business.sales",
    "customer success": "business.customer_success",
    "customer support": "business.customer_support",
    support: "business.customer_support",
  };

  for (const [keyword, categorySlug] of Object.entries(categoryMapping)) {
    if (text.includes(keyword)) {
      const [category] = await db
        .select()
        .from(jobCategories)
        .where(eq(jobCategories.slug, categorySlug))
        .limit(1);

      if (category) return category.id;
    }
  }

  return null;
}

/**
 * Extract skills from content and title
 */
function extractSkills(title: string, content?: string): string[] {
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "Ruby",
    "PHP",
    "C++",
    "C#",
    "Swift",
    "Kotlin",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Django",
    "Flask",
    "Rails",
    "Laravel",
    "Spring",
    "Express",
    "Next.js",
    "Nuxt",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Git",
    "GraphQL",
    "REST",
    "API",
  ];

  const text = `${title} ${content || ""}`.toLowerCase();
  const foundSkills: string[] = [];

  for (const skill of commonSkills) {
    const skillLower = skill.toLowerCase();
    if (text.includes(skillLower)) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)].slice(0, 10); // Max 10 skills
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
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crawl Greenhouse jobs from multiple companies
 */
export async function crawlGreenhouse(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  const allRemoteJobs: GreenhouseJob[] = [];

  try {
    console.log(
      `Fetching jobs from ${GREENHOUSE_COMPANIES.length} companies via Greenhouse API...`
    );

    // Fetch jobs from each company
    for (const company of GREENHOUSE_COMPANIES) {
      try {
        console.log(`  Fetching ${company}...`);

        const response = await axios.get<GreenhouseJobsResponse>(
          `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "RemoteJobs-Aggregator/1.0",
            },
            timeout: 15000,
          }
        );

        const jobs = response.data?.jobs || [];
        const remoteJobs = jobs.filter((job) => isRemoteJob(job.location.name));

        console.log(`    Total: ${jobs.length}, Remote: ${remoteJobs.length}`);
        allRemoteJobs.push(...remoteJobs);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `    Error fetching ${company}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`\nTotal remote jobs fetched: ${allRemoteJobs.length}`);

    // Filter jobs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = allRemoteJobs.filter((job) => {
      const publishDate = new Date(job.first_published);
      return publishDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        const sourceUrl = jobData.absolute_url;

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
        const categoryId = await getCategoryFromJob(jobData.title, jobData.departments);

        // Map job data
        const jobType = mapJobType(jobData.title, jobData.content);
        const experienceLevel = mapExperienceLevel(jobData.title);

        // Clean description
        const description = jobData.content
          ? stripHtml(jobData.content).slice(0, 5000)
          : jobData.title;

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.title,
            companyName: jobData.company_name,
            companyLogo: null, // Greenhouse API doesn't provide company logos
            type: jobType,
            remoteType: "FULLY_REMOTE",
            location: jobData.location.name,
            description,
            applyMethod: sourceUrl,
            source: "GREENHOUSE",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.first_published),
            categoryId,
            experienceLevel,
          })
          .returning();

        // Extract and add skills
        const detectedSkills = extractSkills(jobData.title, jobData.content);
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
        console.error("Error saving Greenhouse job:", error);
        failCount++;
      }
    }

    console.log(`Greenhouse crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling Greenhouse:", error);
    throw error;
  }
}
