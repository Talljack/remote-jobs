import axios from "axios";
import { eq, and } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// Himalayas API
const HIMALAYAS_API_URL = "https://himalayas.app/jobs/api";

interface HimalayasJob {
  title: string;
  companyName: string;
  companyLogo?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  seniority?: string[];
  categories?: string[];
  description?: string;
  applicationLink: string;
  pubDate: number;
  locationRestrictions?: string[];
}

interface HimalayasApiResponse {
  jobs: HimalayasJob[];
  totalCount: number;
  offset: number;
  limit: number;
}

/**
 * Map Himalayas job type to our job type
 */
function mapJobType(jobType?: string): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  if (!jobType) return "FULL_TIME";

  const type = jobType.toLowerCase();

  if (type.includes("part") || type.includes("part-time")) return "PART_TIME";
  if (type.includes("contract") || type.includes("freelance")) return "CONTRACT";
  if (type.includes("intern")) return "INTERNSHIP";

  return "FULL_TIME";
}

/**
 * Map seniority level to experience level
 */
function mapExperienceLevel(
  level?: string
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  if (!level) return null;

  const lowerLevel = level.toLowerCase();

  if (lowerLevel.includes("junior") || lowerLevel.includes("entry")) return "ENTRY";
  if (lowerLevel.includes("mid")) return "MID";
  if (lowerLevel.includes("senior")) return "SENIOR";
  if (lowerLevel.includes("lead") || lowerLevel.includes("head")) return "LEAD";
  if (lowerLevel.includes("staff")) return "STAFF";
  if (lowerLevel.includes("principal")) return "PRINCIPAL";

  return null;
}

/**
 * Determine category from tags
 */
async function getCategoryFromTags(tags?: string[]): Promise<string | null> {
  if (!tags || tags.length === 0) return null;

  const categoryMapping: Record<string, string> = {
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
    // Full Stack & Other Engineering
    "full-stack": "engineering.fullstack",
    fullstack: "engineering.fullstack",
    mobile: "engineering.mobile",
    devops: "engineering.devops",
    qa: "engineering.qa",
    security: "engineering.security",
    blockchain: "engineering.blockchain",
    web3: "engineering.blockchain",
    // Data
    "data-science": "data.science",
    "data-scientist": "data.science",
    "data-engineer": "data.engineer",
    "data-analyst": "data.analyst",
    // AI/ML
    "machine-learning": "ml.ai",
    ai: "ml.ai",
    "ai-engineer": "ml.ai.engineer",
    "ai-agent": "ml.ai.agent",
    agent: "ml.ai.agent",
    llm: "ml.ai.llm",
    "computer-vision": "ml.ai.vision",
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
    support: "business.customer_support",
    "customer-success": "business.customer_success",
  };

  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, "-");
    const categorySlug = categoryMapping[normalizedTag];

    if (categorySlug) {
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
 * Crawl Himalayas remote jobs
 */
export async function crawlHimalayas(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching jobs from Himalayas API...");

    // Note: Himalayas API limits to 20 jobs per request
    // We'll fetch multiple pages if needed
    const allJobs: HimalayasJob[] = [];
    let page = 0;
    const limit = 20;
    const maxPages = 5; // Fetch max 100 jobs (5 pages * 20)

    while (page < maxPages) {
      try {
        const response = await axios.get<HimalayasApiResponse>(HIMALAYAS_API_URL, {
          params: {
            limit,
            offset: page * limit,
          },
          headers: {
            Accept: "application/json",
            "User-Agent": "RemoteJobs-Aggregator/1.0",
          },
          timeout: 10000,
        });

        const jobs = response.data?.jobs || [];
        console.log(`  Page ${page + 1}: ${jobs.length} jobs`);

        if (jobs.length === 0) {
          console.log("  No more jobs, stopping pagination");
          break;
        }

        allJobs.push(...jobs);

        // If we got less than limit, we've reached the end
        if (jobs.length < limit) break;

        page++;

        // Rate limiting - wait 2 seconds between requests
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error fetching page ${page + 1}:`, error);
        break;
      }
    }

    console.log(`Total jobs fetched: ${allJobs.length}`);

    // Filter jobs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = allJobs.filter((job) => {
      const publishDate = new Date(job.pubDate * 1000); // Convert Unix timestamp to Date
      return publishDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        const sourceUrl = jobData.applicationLink;

        // Check if job already exists
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        // Get category from categories
        const categoryId = await getCategoryFromTags(jobData.categories);

        // Map job type and experience level
        const jobType = mapJobType(jobData.employmentType);
        const experienceLevel = mapExperienceLevel(jobData.seniority?.[0]);

        // Determine location
        const location = jobData.locationRestrictions?.join(", ") || "Worldwide";

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.title,
            companyName: jobData.companyName,
            companyLogo: jobData.companyLogo || null,
            type: jobType,
            remoteType: "FULLY_REMOTE", // Himalayas only lists remote jobs
            location,
            description: jobData.description || jobData.title,
            applyMethod: sourceUrl,
            source: "HIMALAYAS",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.pubDate * 1000),
            salaryMin: jobData.minSalary || null,
            salaryMax: jobData.maxSalary || null,
            salaryCurrency: jobData.currency || "USD",
            categoryId,
            experienceLevel,
          })
          .returning();

        // Add skills from categories
        if (jobData.categories && jobData.categories.length > 0) {
          for (const category of jobData.categories.slice(0, 10)) {
            try {
              const skillId = await getOrCreateSkill(category);

              // Check if relation already exists
              const [existingRelation] = await db
                .select()
                .from(jobSkillRelations)
                .where(
                  and(
                    eq(jobSkillRelations.jobId, newJob.id),
                    eq(jobSkillRelations.skillId, skillId)
                  )
                )
                .limit(1);

              if (!existingRelation) {
                await db.insert(jobSkillRelations).values({
                  jobId: newJob.id,
                  skillId,
                });
              }
            } catch (error) {
              console.warn(`Failed to add skill ${category}:`, error);
            }
          }
        }

        successCount++;
      } catch (error) {
        console.error("Error saving Himalayas job:", error);
        failCount++;
      }
    }

    console.log(`Himalayas crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling Himalayas:", error);
    throw error;
  }
}
