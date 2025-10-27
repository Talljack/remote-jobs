import { eq } from "drizzle-orm";
import Parser from "rss-parser";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// Indeed RSS Feed for remote jobs
// Note: Indeed's RSS feeds are regional. Update the URL based on target region.
const INDEED_RSS_URLS = [
  "https://www.indeed.com/rss?q=remote&l=", // US remote jobs
  "https://ca.indeed.com/rss?q=remote&l=", // Canada remote jobs
];

interface IndeedRSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  guid?: string;
}

/**
 * Category mapping from job title keywords
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Engineering
  "frontend developer": "engineering.frontend",
  "front end developer": "engineering.frontend",
  "frontend engineer": "engineering.frontend",
  "react developer": "engineering.frontend",
  "vue developer": "engineering.frontend",
  "angular developer": "engineering.frontend",

  "backend developer": "engineering.backend",
  "back end developer": "engineering.backend",
  "backend engineer": "engineering.backend",
  "node developer": "engineering.backend",
  "python developer": "engineering.backend",
  "java developer": "engineering.backend",
  "go developer": "engineering.backend",

  "full stack developer": "engineering.fullstack",
  "fullstack developer": "engineering.fullstack",
  "full stack engineer": "engineering.fullstack",

  "mobile developer": "engineering.mobile",
  "ios developer": "engineering.mobile",
  "android developer": "engineering.mobile",

  "devops engineer": "engineering.devops",
  "site reliability engineer": "engineering.devops",
  sre: "engineering.devops",

  "qa engineer": "engineering.qa",
  "test engineer": "engineering.qa",
  "quality assurance": "engineering.qa",

  "security engineer": "engineering.security",
  cybersecurity: "engineering.security",

  // Data & AI
  "data scientist": "data.science",
  "machine learning engineer": "ml.ai",
  "ml engineer": "ml.ai",
  "ai engineer": "ml.ai",
  "data engineer": "data.engineer",
  "data analyst": "data.analyst",

  // Product & Design
  "product manager": "product.manager",
  designer: "product.designer",
  "ux designer": "ux.designer",
  "ui designer": "ui.designer",
  "ui/ux designer": "ux.designer",

  // Business
  "sales representative": "business.sales",
  "marketing manager": "business.marketing",
  "customer success": "business.customer_success",
  "customer support": "business.customer_support",
  "support engineer": "business.customer_support",
};

/**
 * Experience level detection
 */
function detectExperienceLevel(
  title: string,
  description: string
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("principal") || text.includes("distinguished")) return "PRINCIPAL";
  if (text.includes("staff")) return "STAFF";
  if (text.includes("lead") || text.includes("head of") || text.includes("director")) return "LEAD";
  if (text.includes("senior") || text.includes("sr.") || text.includes("sr ")) return "SENIOR";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry level"))
    return "ENTRY";
  if (text.includes("mid-level") || text.includes("intermediate")) return "MID";

  return null;
}

/**
 * Determine job type
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
 * Get category ID from title
 */
async function getCategoryFromTitle(title: string): Promise<string | null> {
  const lowerTitle = title.toLowerCase();

  for (const [keyword, categorySlug] of Object.entries(CATEGORY_MAPPING)) {
    if (lowerTitle.includes(keyword)) {
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
 * Extract skills from title and description
 */
function extractSkills(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const skillKeywords = [
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "node.js",
    "python",
    "java",
    "go",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "postgresql",
    "mongodb",
    "redis",
    "graphql",
    "rest api",
    "ci/cd",
    "git",
    "agile",
    "scrum",
  ];

  const foundSkills: string[] = [];
  for (const skill of skillKeywords) {
    if (text.includes(skill)) {
      foundSkills.push(skill);
    }
  }

  return foundSkills;
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
 * Parse company name from Indeed RSS (it's usually in title)
 */
function parseCompanyName(title: string): string {
  // Indeed format is usually: "Job Title at Company Name"
  const match = title.match(/at\s+(.+)$/i);
  return match ? match[1].trim() : "Unknown Company";
}

/**
 * Crawl Indeed jobs via RSS
 */
export async function crawlIndeed(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  const parser = new Parser();

  try {
    console.log("Fetching jobs from Indeed RSS feeds...");

    const allItems: IndeedRSSItem[] = [];

    // Fetch from all RSS feeds
    for (const rssUrl of INDEED_RSS_URLS) {
      try {
        const feed = await parser.parseURL(rssUrl);
        console.log(`  Fetched ${feed.items.length} items from ${rssUrl}`);
        allItems.push(...feed.items);
      } catch (error) {
        console.error(`Error fetching RSS from ${rssUrl}:`, error);
      }
    }

    console.log(`Total items fetched: ${allItems.length}`);

    // Filter for recent jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentItems = allItems.filter((item) => {
      if (!item.pubDate) return false;
      const itemDate = new Date(item.pubDate);
      return itemDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentItems.length} recent items (last 30 days)`);

    // Process each item
    for (const item of recentItems) {
      try {
        if (!item.title || !item.link) {
          console.warn("Skipping item without title or link");
          continue;
        }

        // Check if job already exists
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, item.link))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        const description = item.contentSnippet || item.content || item.title;
        const companyName = parseCompanyName(item.title);
        const jobTitle = item.title.replace(/\s+at\s+.+$/i, "").trim();

        // Determine category
        const categoryId = await getCategoryFromTitle(item.title);

        // Detect experience level and job type
        const experienceLevel = detectExperienceLevel(item.title, description);
        const jobType = determineJobType(item.title, description);

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobTitle,
            companyName,
            type: jobType,
            remoteType: "FULLY_REMOTE",
            location: "Remote",
            description,
            applyMethod: item.link,
            source: "INDEED",
            sourceUrl: item.link,
            status: "PUBLISHED",
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            categoryId,
            experienceLevel,
          })
          .returning();

        // Extract and add skills
        const skillNames = extractSkills(item.title, description);
        for (const skillName of skillNames) {
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
        console.error("Error saving Indeed job:", error);
        failCount++;
      }
    }

    console.log(`Indeed crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentItems.length,
    };
  } catch (error) {
    console.error("Error crawling Indeed:", error);
    throw error;
  }
}
