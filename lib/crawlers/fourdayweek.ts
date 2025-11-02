import { eq } from "drizzle-orm";
import Parser from "rss-parser";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import type { SkillCategory } from "@/db/schema";
import { slugify } from "@/lib/utils";

// 4 Day Week RSS Feed
const FOURDAYWEEK_RSS_URL = "https://4dayweek.io/rss";

interface FourDayWeekItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
}

/**
 * Category mapping from job title keywords to our categories
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Engineering
  "front end": "engineering.frontend",
  "front-end": "engineering.frontend",
  frontend: "engineering.frontend",
  react: "engineering.frontend",
  vue: "engineering.frontend",

  "back end": "engineering.backend",
  "back-end": "engineering.backend",
  backend: "engineering.backend",
  "node.js": "engineering.backend",
  python: "engineering.backend",
  java: "engineering.backend",

  "full stack": "engineering.fullstack",
  "full-stack": "engineering.fullstack",
  fullstack: "engineering.fullstack",

  mobile: "engineering.mobile",
  ios: "engineering.mobile",
  android: "engineering.mobile",

  devops: "engineering.devops",
  sre: "engineering.devops",
  infrastructure: "engineering.devops",
  platform: "engineering.devops",

  qa: "engineering.qa",
  "quality assurance": "engineering.qa",
  test: "engineering.qa",

  security: "engineering.security",
  cybersecurity: "engineering.security",

  // Data & AI
  "data scientist": "data.science",
  "data science": "data.science",
  "machine learning": "ml.ai",
  "ml engineer": "ml.ai",
  ai: "ml.ai",
  "data engineer": "data.engineer",
  "data analyst": "data.analyst",

  // Product & Design
  "product manager": "product.manager",
  "product owner": "product.manager",
  designer: "product.designer",
  "ux designer": "ux.designer",
  "ui designer": "ui.designer",
  "product designer": "product.designer",

  // Business
  sales: "business.sales",
  marketing: "business.marketing",
  operations: "business.operations",
  "customer success": "business.customer_success",
  "customer support": "business.customer_support",
  support: "business.customer_support",

  // Other
  content: "other.content",
  writer: "other.content",
  hr: "other.hr",
  recruiter: "other.hr",
  finance: "other.finance",
  legal: "other.legal",
  "project manager": "other.project_manager",
  agile: "other.project_manager",
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
  if (
    text.includes("junior") ||
    text.includes("jr.") ||
    text.includes("entry") ||
    text.includes("intern")
  ) {
    return "ENTRY";
  }
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
 * Extract location from title
 */
function extractLocation(title: string): string {
  // Match "Remote [Location]" or "| Remote [Location]"
  const remoteMatch = title.match(/[|]\s*Remote\s+([^|]+)/i);
  if (remoteMatch) {
    return remoteMatch[1].trim();
  }

  // Default to Worldwide if no location found
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
 * Extract skills from title and description
 */
function extractSkills(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
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
 * Crawl 4 Day Week jobs
 */
export async function crawlFourDayWeek(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching jobs from 4 Day Week RSS...");

    const parser = new Parser();
    const feed = await parser.parseURL(FOURDAYWEEK_RSS_URL);

    console.log(`Fetched ${feed.items.length} jobs from 4 Day Week`);

    // Filter for jobs posted in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = feed.items.filter((item) => {
      const jobDate = item.pubDate ? new Date(item.pubDate) : new Date();
      return jobDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const item of recentJobs) {
      try {
        const jobData = item as unknown as FourDayWeekItem;

        // Check if job already exists
        const sourceUrl = jobData.link;
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        // Extract location from title
        const location = extractLocation(jobData.title);

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
        const experienceLevel = detectExperienceLevel(jobData.title, jobData.contentSnippet || "");

        // Determine job type
        const jobType = determineJobType(jobData.title, jobData.contentSnippet || "");

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
            description: jobData.content || jobData.contentSnippet || jobData.title,
            applyMethod: sourceUrl,
            source: "FOURDAYWEEK",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: jobData.pubDate ? new Date(jobData.pubDate) : new Date(),
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: null,
            categoryId,
            experienceLevel,
          })
          .returning();

        // Extract and add skills
        const skillsList = extractSkills(jobData.title, jobData.contentSnippet || "");
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
        console.error("Error saving 4 Day Week job:", error);
        failCount++;
      }
    }

    console.log(`4 Day Week crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling 4 Day Week:", error);
    throw error;
  }
}
