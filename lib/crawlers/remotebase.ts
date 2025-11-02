import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import type { SkillCategory } from "@/db/schema";
import { slugify } from "@/lib/utils";

// RemoteBase API
const REMOTEBASE_API_URL = "https://remotebase.com/api/jobs";

interface RemoteBaseJob {
  id: number;
  shortcode: string;
  title: string;
  remote: boolean;
  location: {
    country: string;
    countryCode: string;
    city: string;
    region: string | null;
  };
  locations: Array<{
    country: string;
    countryCode: string;
    city: string;
    region: string | null;
    hidden: boolean;
  }>;
  state: string;
  isInternal: boolean;
  code: string;
  published: string;
  type?: string;
  language: string;
  department: string[];
  accountUid: string;
  approvalStatus: string;
  workplace: string;
}

interface RemoteBaseResponse {
  jobs: RemoteBaseJob[];
}

/**
 * Category mapping from job title and department keywords to our categories
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Engineering
  "software engineer": "engineering.fullstack",
  frontend: "engineering.frontend",
  "front end": "engineering.frontend",
  "front-end": "engineering.frontend",
  react: "engineering.frontend",
  vue: "engineering.frontend",

  backend: "engineering.backend",
  "back end": "engineering.backend",
  "back-end": "engineering.backend",
  python: "engineering.backend",
  node: "engineering.backend",
  java: "engineering.backend",

  "full stack": "engineering.fullstack",
  fullstack: "engineering.fullstack",

  mobile: "engineering.mobile",
  ios: "engineering.mobile",
  android: "engineering.mobile",

  devops: "engineering.devops",
  "operations engineer": "engineering.devops",
  "platform engineer": "engineering.devops",
  sre: "engineering.devops",

  qa: "engineering.qa",
  test: "engineering.qa",
  "quality assurance": "engineering.qa",

  security: "engineering.security",

  // Data & AI
  "data scientist": "data.science",
  "data engineer": "data.engineer",
  "data analyst": "data.analyst",
  "machine learning": "ml.ai",
  "ml engineer": "ml.ai",
  ai: "ml.ai",

  // Product & Design
  "product manager": "product.manager",
  "product owner": "product.manager",
  designer: "product.designer",
  ux: "ux.designer",
  ui: "ui.designer",

  // Business
  sales: "business.sales",
  marketing: "business.marketing",
  "operations associate": "business.operations",
  "customer success": "business.customer_success",
  "customer support": "business.customer_support",
  support: "business.customer_support",

  // Other
  content: "other.content",
  hr: "other.hr",
  recruiter: "other.hr",
  finance: "other.finance",
  legal: "other.legal",
  "project manager": "other.project_manager",
};

/**
 * Experience level detection from title
 */
function detectExperienceLevel(
  title: string
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("principal") || titleLower.includes("distinguished")) return "PRINCIPAL";
  if (titleLower.includes("staff")) return "STAFF";
  if (titleLower.includes("lead") || titleLower.includes("head of")) return "LEAD";
  if (titleLower.includes("senior") || titleLower.includes("sr.")) return "SENIOR";
  if (
    titleLower.includes("junior") ||
    titleLower.includes("jr.") ||
    titleLower.includes("entry") ||
    titleLower.includes("intern")
  ) {
    return "ENTRY";
  }
  if (titleLower.includes("mid-level") || titleLower.includes("intermediate")) return "MID";

  return null;
}

/**
 * Determine job type from RemoteBase type field
 */
function determineJobType(
  type?: string,
  title?: string
): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  if (type === "full") return "FULL_TIME";
  if (type === "part") return "PART_TIME";
  if (type === "contract") return "CONTRACT";
  if (type === "intern") return "INTERNSHIP";

  // Fallback to title-based detection
  const text = (title || "").toLowerCase();
  if (text.includes("intern") || text.includes("internship")) return "INTERNSHIP";
  if (text.includes("part-time") || text.includes("part time")) return "PART_TIME";
  if (text.includes("contract") || text.includes("contractor") || text.includes("freelance")) {
    return "CONTRACT";
  }

  return "FULL_TIME";
}

/**
 * Format location string
 */
function formatLocation(job: RemoteBaseJob): string {
  if (job.remote && job.locations && job.locations.length > 0) {
    const loc = job.locations[0];
    const parts = [loc.city, loc.region, loc.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Worldwide";
  }
  return "Worldwide";
}

/**
 * Map category slug to category ID
 */
async function getCategoryId(categorySlug: string): Promise<string | null> {
  const [category] = await db
    .select()
    .from(jobCategories)
    .where(eq(jobCategories.slug, categorySlug))
    .limit(1);

  return category?.id || null;
}

/**
 * Extract skills from title and department
 */
function extractSkills(title: string, department: string[]): string[] {
  const text = `${title} ${department.join(" ")}`.toLowerCase();
  const skills: Set<string> = new Set();

  const skillKeywords = [
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "nodejs",
    "python",
    "java",
    "golang",
    "rust",
    "php",
    "kubernetes",
    "docker",
    "aws",
    "gcp",
    "azure",
    "sql",
    "mongodb",
    "postgresql",
    "redis",
    "figma",
    "sketch",
    "agile",
    "scrum",
  ];

  for (const skill of skillKeywords) {
    if (text.includes(skill)) {
      skills.add(skill);
    }
  }

  return Array.from(skills);
}

/**
 * Get or create skill
 */
async function getOrCreateSkill(
  skillName: string,
  category?: SkillCategory | null
): Promise<string> {
  const skillSlug = slugify(skillName);

  let [skill] = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);

  if (!skill) {
    [skill] = await db
      .insert(skills)
      .values({
        name: skillName,
        slug: skillSlug,
        category: category ?? null,
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
 * Crawl RemoteBase jobs
 */
export async function crawlRemoteBase(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching jobs from RemoteBase API...");

    const response = await axios.get<RemoteBaseResponse>(REMOTEBASE_API_URL, {
      headers: {
        "User-Agent": "RemoteJobs-Aggregator/1.0",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const allJobs = response.data.jobs;
    console.log(`Fetched ${allJobs.length} jobs from RemoteBase`);

    // Filter for remote jobs and published jobs
    const remoteJobs = allJobs.filter(
      (job) => job.remote === true && job.state === "published" && job.approvalStatus === "approved"
    );

    // Filter for jobs posted in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = remoteJobs.filter((job) => {
      const jobDate = new Date(job.published);
      return jobDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent remote jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        // Check if job already exists using shortcode as unique identifier
        const sourceUrl = `https://remotebase.com/jobs/${jobData.shortcode}`;
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        // Determine category from title
        let categoryId: string | null = null;
        const titleLower = jobData.title.toLowerCase();
        for (const [keyword, categorySlug] of Object.entries(CATEGORY_MAPPING)) {
          if (titleLower.includes(keyword)) {
            categoryId = await getCategoryId(categorySlug);
            if (categoryId) break;
          }
        }

        // Detect experience level
        const experienceLevel = detectExperienceLevel(jobData.title);

        // Determine job type
        const jobType = determineJobType(jobData.type, jobData.title);

        // Format location
        const location = formatLocation(jobData);

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.title,
            companyName: "Unknown Company",
            companyLogo: null,
            companyWebsite: null,
            type: jobType,
            remoteType: "FULLY_REMOTE",
            location,
            description: jobData.title,
            applyMethod: sourceUrl,
            source: "REMOTEBASE",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.published),
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: null,
            categoryId,
            experienceLevel,
          })
          .returning();

        // Extract and add skills
        const skillsList = extractSkills(jobData.title, jobData.department || []);
        for (const skillName of skillsList) {
          try {
            const skillId = await getOrCreateSkill(skillName);
            await db.insert(jobSkillRelations).values({
              jobId: newJob.id,
              skillId,
            });
          } catch (error) {
            console.warn(`Failed to add skill ${skillName}:`, error);
          }
        }

        successCount++;
      } catch (error) {
        console.error("Error saving RemoteBase job:", error);
        failCount++;
      }
    }

    console.log(`RemoteBase crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling RemoteBase:", error);
    throw error;
  }
}
