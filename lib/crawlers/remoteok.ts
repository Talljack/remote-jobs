import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import type { SkillCategory } from "@/db/schema";
import { slugify } from "@/lib/utils";

// RemoteOK API
const REMOTEOK_API_URL = "https://remoteok.com/api";

interface RemoteOKJob {
  id: string;
  slug: string;
  url: string;
  position: string;
  company: string;
  company_logo: string;
  location: string;
  tags: string[];
  description: string;
  date: string;
  salary_min?: number;
  salary_max?: number;
  apply_url: string;
  // Optional fields
  company_link?: string;
  featured?: boolean;
  verified?: boolean;
}

/**
 * Category mapping from RemoteOK tags to our categories
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Engineering
  frontend: "engineering.frontend",
  "front end": "engineering.frontend",
  "front-end": "engineering.frontend",
  react: "engineering.frontend",
  vue: "engineering.frontend",
  angular: "engineering.frontend",

  backend: "engineering.backend",
  "back end": "engineering.backend",
  "back-end": "engineering.backend",
  node: "engineering.backend",
  python: "engineering.backend",
  java: "engineering.backend",
  go: "engineering.backend",
  golang: "engineering.backend",

  fullstack: "engineering.fullstack",
  "full stack": "engineering.fullstack",
  "full-stack": "engineering.fullstack",

  mobile: "engineering.mobile",
  ios: "engineering.mobile",
  android: "engineering.mobile",
  "react native": "engineering.mobile",

  devops: "engineering.devops",
  sre: "engineering.devops",
  infrastructure: "engineering.devops",

  qa: "engineering.qa",
  testing: "engineering.qa",
  "quality assurance": "engineering.qa",

  security: "engineering.security",
  infosec: "engineering.security",

  // Data & AI
  "data science": "data.science",
  "data scientist": "data.science",
  "machine learning": "ml.ai",
  "ml engineer": "ml.ai",
  ai: "ml.ai",
  "data engineer": "data.engineer",
  "data analyst": "data.analyst",

  // Product & Design
  product: "product.manager",
  "product manager": "product.manager",
  pm: "product.manager",
  design: "product.designer",
  designer: "product.designer",
  ux: "ux.designer",
  "ux designer": "ux.designer",
  ui: "ui.designer",
  "ui designer": "ui.designer",

  // Business
  sales: "business.sales",
  marketing: "business.marketing",
  operations: "business.operations",
  "customer success": "business.customer_success",
  "customer support": "business.customer_support",
  support: "business.customer_support",

  // Other
  content: "other.content",
  writing: "other.content",
  writer: "other.content",
  hr: "other.hr",
  recruiter: "other.hr",
  finance: "other.finance",
  legal: "other.legal",
};

/**
 * Experience level detection from title/description
 */
function detectExperienceLevel(
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
 * Determine job type from title/description
 */
function determineJobType(
  title: string,
  description: string
): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("intern") || text.includes("internship")) return "INTERNSHIP";
  if (text.includes("part-time") || text.includes("part time")) return "PART_TIME";
  if (text.includes("contract") || text.includes("contractor") || text.includes("freelance")) {
    return "CONTRACT";
  }

  return "FULL_TIME";
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
 * Get or create skill
 */
async function getOrCreateSkill(
  skillName: string,
  category?: SkillCategory | null
): Promise<string> {
  const skillSlug = slugify(skillName);

  // Check if skill exists
  let [skill] = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);

  // Create skill if doesn't exist
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
    // Increment skill count
    await db
      .update(skills)
      .set({ count: skill.count + 1 })
      .where(eq(skills.id, skill.id));
  }

  return skill.id;
}

/**
 * Crawl RemoteOK jobs
 */
export async function crawlRemoteOK(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching jobs from RemoteOK API...");

    const response = await axios.get<RemoteOKJob[]>(REMOTEOK_API_URL, {
      headers: {
        "User-Agent": "RemoteJobs-Aggregator/1.0",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    // RemoteOK API returns an array, first item is metadata
    const allJobs = response.data.slice(1) as RemoteOKJob[];

    console.log(`Fetched ${allJobs.length} jobs from RemoteOK`);

    // Filter for jobs posted in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = allJobs.filter((job) => {
      const jobDate = new Date(job.date);
      return jobDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        // Check if job already exists
        const sourceUrl = jobData.url || `https://remoteok.com/remote-jobs/${jobData.slug}`;
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          // Job already exists, skip
          continue;
        }

        // Determine category from tags
        let categoryId: string | null = null;
        for (const tag of jobData.tags || []) {
          const tagLower = tag.toLowerCase();
          if (CATEGORY_MAPPING[tagLower]) {
            categoryId = await getCategoryId(CATEGORY_MAPPING[tagLower]);
            if (categoryId) break;
          }
        }

        // Detect experience level
        const experienceLevel = detectExperienceLevel(jobData.position, jobData.description || "");

        // Determine job type
        const jobType = determineJobType(jobData.position, jobData.description || "");

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.position,
            companyName: jobData.company || "Unknown Company",
            companyLogo: jobData.company_logo || null,
            companyWebsite: jobData.company_link || null,
            type: jobType,
            remoteType: "FULLY_REMOTE",
            location: jobData.location || "Worldwide",
            description: jobData.description || jobData.position,
            applyMethod: jobData.apply_url || sourceUrl,
            source: "REMOTEOK",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.date),
            salaryMin: jobData.salary_min || null,
            salaryMax: jobData.salary_max || null,
            salaryCurrency: "USD",
            categoryId,
            experienceLevel,
          })
          .returning();

        // Add skills from tags
        for (const tag of jobData.tags || []) {
          // Skip non-skill tags
          if (
            tag.toLowerCase() === "remote" ||
            tag.toLowerCase() === "worldwide" ||
            tag.length < 2
          ) {
            continue;
          }

          try {
            const skillId = await getOrCreateSkill(tag);

            // Create job-skill relation
            await db.insert(jobSkillRelations).values({
              jobId: newJob.id,
              skillId,
            });
          } catch (error) {
            // Skip if skill creation fails (e.g., duplicate)
            console.warn(`Failed to add skill ${tag}:`, error);
          }
        }

        successCount++;
      } catch (error) {
        console.error("Error saving RemoteOK job:", error);
        failCount++;
      }
    }

    console.log(`RemoteOK crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling RemoteOK:", error);
    throw error;
  }
}
