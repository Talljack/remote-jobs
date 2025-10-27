/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

/**
 * Boss Zhipin (Boss直聘) Crawler
 *
 * NOTE: Boss Zhipin does not provide a public API and has anti-scraping measures.
 * This is a placeholder implementation that would require:
 * 1. Browser automation (Puppeteer/Playwright)
 * 2. Proxy rotation
 * 3. CAPTCHA solving service
 * 4. Or an official API key (if available)
 *
 * For production use, consider:
 * - Contact Boss Zhipin for official API access
 * - Use a third-party data service
 * - Implement with proper rate limiting and compliance
 */

const BOSS_ZHIPIN_API_KEY = process.env.BOSS_ZHIPIN_API_KEY || "";
const BOSS_ZHIPIN_SEARCH_URL = "https://www.zhipin.com/wapi/zpgeek/search/joblist.json";

/**
 * Category mapping (Chinese to our categories)
 */
const CATEGORY_MAPPING: Record<string, string> = {
  前端开发: "engineering.frontend",
  后端开发: "engineering.backend",
  全栈开发: "engineering.fullstack",
  移动开发: "engineering.mobile",
  iOS开发: "engineering.mobile",
  Android开发: "engineering.mobile",
  运维: "engineering.devops",
  测试: "engineering.qa",
  安全: "engineering.security",
  数据科学: "data.science",
  数据分析: "data.analyst",
  数据工程: "data.engineer",
  机器学习: "ml.ai",
  人工智能: "ml.ai",
  产品经理: "product.manager",
  设计师: "product.designer",
  UI设计: "ui.designer",
  UX设计: "ux.designer",
  市场营销: "business.marketing",
  销售: "business.sales",
  客服: "business.customer_support",
};

/**
 * Map experience level
 */
function mapExperienceLevel(level: string): "ENTRY" | "MID" | "SENIOR" | "LEAD" | null {
  if (level.includes("1-3年") || level.includes("应届")) return "ENTRY";
  if (level.includes("3-5年")) return "MID";
  if (level.includes("5-10年") || level.includes("10年以上")) return "SENIOR";
  if (level.includes("总监") || level.includes("VP")) return "LEAD";
  return null;
}

/**
 * Get category ID from Chinese category name
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
 * Crawl Boss Zhipin remote jobs
 *
 * WARNING: This is a placeholder implementation.
 * Boss Zhipin requires browser automation or official API access.
 */
export async function crawlBossZhipin(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  console.log("Boss Zhipin crawler called...");

  // Check if API key is configured
  if (!BOSS_ZHIPIN_API_KEY) {
    console.warn("BOSS_ZHIPIN_API_KEY not configured. Skipping Boss Zhipin crawl.");
    console.warn("To enable Boss Zhipin crawler, you need to:");
    console.warn("1. Obtain official API access from Boss Zhipin");
    console.warn("2. Set BOSS_ZHIPIN_API_KEY in your .env file");
    console.warn("3. Implement the actual crawling logic below");

    return {
      success: 0,
      failed: 0,
      total: 0,
    };
  }

  const successCount = 0;
  const failCount = 0;

  try {
    console.log("Fetching jobs from Boss Zhipin...");

    // TODO: Implement actual API call when credentials are available
    // Example structure (will vary based on actual API):
    /*
    const response = await axios.get(BOSS_ZHIPIN_SEARCH_URL, {
      params: {
        query: '远程',
        city: '100010000', // All cities
        page: 1,
        pageSize: 30,
      },
      headers: {
        'Authorization': `Bearer ${BOSS_ZHIPIN_API_KEY}`,
        'User-Agent': 'RemoteJobs-Aggregator/1.0',
      },
    });

    const jobList = response.data.zpData.jobList;

    for (const jobData of jobList) {
      try {
        // Process each job
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, jobData.jobUrl))
          .limit(1);

        if (existingJob.length > 0) continue;

        const categoryId = await getCategoryId(jobData.positionName);
        const experienceLevel = mapExperienceLevel(jobData.jobExperience);

        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.jobName,
            companyName: jobData.brandName,
            companyLogo: jobData.brandLogo,
            type: 'FULL_TIME',
            remoteType: 'FULLY_REMOTE',
            location: jobData.cityName || '远程',
            description: jobData.jobLabels?.join(', ') || jobData.jobName,
            applyMethod: jobData.jobUrl,
            source: 'BOSS_ZHIPIN',
            sourceUrl: jobData.jobUrl,
            status: 'PUBLISHED',
            publishedAt: new Date(jobData.createTime),
            salaryMin: jobData.salaryDesc?.min || null,
            salaryMax: jobData.salaryDesc?.max || null,
            salaryCurrency: 'CNY',
            categoryId,
            experienceLevel,
          })
          .returning();

        // Add skills
        if (jobData.skills) {
          for (const skill of jobData.skills) {
            const skillId = await getOrCreateSkill(skill);
            await db.insert(jobSkillRelations).values({
              jobId: newJob.id,
              skillId,
            });
          }
        }

        successCount++;
      } catch (error) {
        console.error('Error saving Boss Zhipin job:', error);
        failCount++;
      }
    }
    */

    console.log("Boss Zhipin crawler not fully implemented - requires API credentials");

    return {
      success: successCount,
      failed: failCount,
      total: 0,
    };
  } catch (error) {
    console.error("Error crawling Boss Zhipin:", error);
    throw error;
  }
}
