import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import type { SkillCategory } from "@/db/schema";
import { slugify } from "@/lib/utils";

// Working Nomads API
const WORKING_NOMADS_API_URL = "https://www.workingnomads.com/api/exposed_jobs/";

interface WorkingNomadsJob {
  url: string;
  title: string;
  description: string;
  company_name: string;
  category_name: string;
  tags: string;
  location: string;
  pub_date: string;
}

/**
 * Category mapping from Working Nomads to our categories
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Development
  development: "engineering.fullstack",
  programming: "engineering.fullstack",
  "software development": "engineering.fullstack",

  // Design
  design: "product.designer",
  "graphic design": "product.designer",
  "ux design": "ux.designer",
  "ui design": "ui.designer",

  // Product & Management
  management: "product.manager",
  "product management": "product.manager",

  // Marketing & Sales
  marketing: "business.marketing",
  sales: "business.sales",

  // Operations & Support
  operations: "business.operations",
  support: "business.customer_support",
  "customer support": "business.customer_support",
  "customer success": "business.customer_success",

  // Data & System
  "system admin": "engineering.devops",
  devops: "engineering.devops",
  "data science": "data.science",

  // Other
  writing: "other.content",
  "content writing": "other.content",
  legal: "other.legal",
  finance: "other.finance",
  hr: "other.hr",
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
 * Crawl Working Nomads jobs
 */
export async function crawlWorkingNomads(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching jobs from Working Nomads API...");

    const response = await axios.get<WorkingNomadsJob[]>(WORKING_NOMADS_API_URL, {
      headers: {
        "User-Agent": "RemoteJobs-Aggregator/1.0",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const allJobs = response.data;
    console.log(`Fetched ${allJobs.length} jobs from Working Nomads`);

    // Filter for jobs posted in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = allJobs.filter((job) => {
      const jobDate = new Date(job.pub_date);
      return jobDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        // Check if job already exists
        const sourceUrl = jobData.url;
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          // Job already exists, skip
          continue;
        }

        // Determine category from category_name
        let categoryId: string | null = null;
        const categoryLower = jobData.category_name.toLowerCase();
        if (CATEGORY_MAPPING[categoryLower]) {
          categoryId = await getCategoryId(CATEGORY_MAPPING[categoryLower]);
        }

        // Detect experience level
        const experienceLevel = detectExperienceLevel(jobData.title, jobData.description);

        // Determine job type
        const jobType = determineJobType(jobData.title, jobData.description);

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.title,
            companyName: jobData.company_name || "Unknown Company",
            companyLogo: null,
            companyWebsite: null,
            type: jobType,
            remoteType: "FULLY_REMOTE",
            location: jobData.location || "Worldwide",
            description: jobData.description,
            applyMethod: sourceUrl,
            source: "WORKING_NOMADS",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.pub_date),
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: null,
            categoryId,
            experienceLevel,
          })
          .returning();

        // Add skills from tags
        if (jobData.tags) {
          const tagList = jobData.tags.split(",").map((tag) => tag.trim());
          for (const tag of tagList) {
            if (!tag || tag.length < 2) continue;

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
        }

        successCount++;
      } catch (error) {
        console.error("Error saving Working Nomads job:", error);
        failCount++;
      }
    }

    console.log(`Working Nomads crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling Working Nomads:", error);
    throw error;
  }
}
