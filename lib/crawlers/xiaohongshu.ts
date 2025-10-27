/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

/**
 * Xiaohongshu (小红书) Crawler
 *
 * NOTE: Xiaohongshu does not provide a public job board API.
 * Job postings on Xiaohongshu are primarily community posts.
 * This is a placeholder implementation that would require:
 * 1. Browser automation to scrape job-related posts
 * 2. Natural language processing to extract structured job info
 * 3. Or partnership with Xiaohongshu for API access
 *
 * Consider: Xiaohongshu may not be a reliable source for structured job listings.
 */

const XIAOHONGSHU_API_KEY = process.env.XIAOHONGSHU_API_KEY || "";

/**
 * Category mapping
 */
const CATEGORY_MAPPING: Record<string, string> = {
  前端: "engineering.frontend",
  后端: "engineering.backend",
  全栈: "engineering.fullstack",
  设计: "product.designer",
  产品: "product.manager",
  运营: "business.marketing",
  市场: "business.marketing",
};

/**
 * Get category ID
 */
async function getCategoryId(categoryName: string): Promise<string | null> {
  const categorySlug = CATEGORY_MAPPING[categoryName];
  if (!categorySlug) return null;

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
 * Crawl Xiaohongshu job posts
 *
 * WARNING: This is a placeholder implementation.
 * Xiaohongshu is primarily a social platform, not a job board.
 * Extracting structured job data would require advanced NLP and scraping.
 */
export async function crawlXiaohongshu(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  console.log("Xiaohongshu crawler called...");

  if (!XIAOHONGSHU_API_KEY) {
    console.warn("XIAOHONGSHU_API_KEY not configured. Skipping Xiaohongshu crawl.");
    console.warn("Note: Xiaohongshu is primarily a social platform and may not be suitable");
    console.warn("for structured job listings. Consider alternative sources.");

    return {
      success: 0,
      failed: 0,
      total: 0,
    };
  }

  const successCount = 0;
  const failCount = 0;

  try {
    console.log("Fetching job posts from Xiaohongshu...");

    // TODO: Implement if/when Xiaohongshu provides structured job data API
    // This would likely require:
    // 1. Search for posts with job-related hashtags (#招聘, #远程工作, etc.)
    // 2. Extract job details using NLP
    // 3. Structure the data into our job format

    console.log(
      "Xiaohongshu crawler not implemented - platform not optimized for structured job listings"
    );

    return {
      success: successCount,
      failed: failCount,
      total: 0,
    };
  } catch (error) {
    console.error("Error crawling Xiaohongshu:", error);
    throw error;
  }
}
