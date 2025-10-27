/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

/**
 * Lagou (拉勾) Crawler
 *
 * NOTE: Lagou has anti-scraping measures and requires login for most API endpoints.
 * This is a placeholder implementation that would require:
 * 1. Official API partnership
 * 2. Or browser automation with proper authentication
 * 3. Proxy rotation and rate limiting
 *
 * For production use:
 * - Contact Lagou for API access
 * - Use a third-party data service
 * - Implement with compliance to Lagou's terms of service
 */

const LAGOU_API_KEY = process.env.LAGOU_API_KEY || "";
const LAGOU_API_URL = "https://www.lagou.com/jobs/positionAjax.json";

/**
 * Category mapping
 */
const CATEGORY_MAPPING: Record<string, string> = {
  前端开发工程师: "engineering.frontend",
  Web前端: "engineering.frontend",
  后端开发工程师: "engineering.backend",
  Java开发: "engineering.backend.java",
  Python开发: "engineering.backend.python",
  "Node.js开发": "engineering.backend.nodejs",
  全栈工程师: "engineering.fullstack",
  移动开发: "engineering.mobile",
  iOS开发: "engineering.mobile",
  Android开发: "engineering.mobile",
  运维工程师: "engineering.devops",
  测试工程师: "engineering.qa",
  算法工程师: "ml.ai",
  数据分析师: "data.analyst",
  数据工程师: "data.engineer",
  产品经理: "product.manager",
  UI设计师: "ui.designer",
  UX设计师: "ux.designer",
  视觉设计师: "product.designer",
};

/**
 * Map work years to experience level
 */
function mapExperienceLevel(workYear: string): "ENTRY" | "MID" | "SENIOR" | "LEAD" | null {
  if (workYear.includes("应届") || workYear.includes("1年以下") || workYear.includes("1-3年"))
    return "ENTRY";
  if (workYear.includes("3-5年")) return "MID";
  if (workYear.includes("5-10年")) return "SENIOR";
  if (workYear.includes("10年以上")) return "LEAD";
  return null;
}

/**
 * Get category ID
 */
async function getCategoryId(positionName: string): Promise<string | null> {
  const categorySlug = CATEGORY_MAPPING[positionName];
  if (!categorySlug) {
    // Try fuzzy matching
    for (const [key, slug] of Object.entries(CATEGORY_MAPPING)) {
      if (positionName.includes(key) || key.includes(positionName)) {
        const [category] = await db
          .select()
          .from(jobCategories)
          .where(eq(jobCategories.slug, slug))
          .limit(1);
        if (category) return category.id;
      }
    }
    return null;
  }

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
 * Crawl Lagou remote jobs
 *
 * WARNING: This is a placeholder implementation.
 * Lagou requires authentication and has anti-scraping measures.
 */
export async function crawlLagou(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  console.log("Lagou crawler called...");

  if (!LAGOU_API_KEY) {
    console.warn("LAGOU_API_KEY not configured. Skipping Lagou crawl.");
    console.warn("To enable Lagou crawler:");
    console.warn("1. Obtain API access from Lagou");
    console.warn("2. Set LAGOU_API_KEY in your .env file");
    console.warn("3. Implement authentication flow below");

    return {
      success: 0,
      failed: 0,
      total: 0,
    };
  }

  const successCount = 0;
  const failCount = 0;

  try {
    console.log("Fetching jobs from Lagou...");

    // TODO: Implement actual API call when credentials are available
    // Example structure (will vary based on actual API):
    /*
    const response = await axios.post(LAGOU_API_URL, {
      first: false,
      pn: 1,
      kd: '远程', // Remote keyword
    }, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.lagou.com/jobs/list_远程',
        'Authorization': `Bearer ${LAGOU_API_KEY}`,
        'User-Agent': 'RemoteJobs-Aggregator/1.0',
      },
    });

    const jobList = response.data.content.positionResult.result;

    for (const jobData of jobList) {
      try {
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, jobData.positionDetailUrl))
          .limit(1);

        if (existingJob.length > 0) continue;

        const categoryId = await getCategoryId(jobData.positionName);
        const experienceLevel = mapExperienceLevel(jobData.workYear);

        // Parse salary
        const salaryRange = jobData.salary.split('-');
        const salaryMin = parseInt(salaryRange[0].replace('k', '')) * 1000;
        const salaryMax = salaryRange[1]
          ? parseInt(salaryRange[1].replace('k', '')) * 1000
          : salaryMin;

        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.positionName,
            companyName: jobData.companyFullName,
            companyLogo: jobData.companyLogo,
            type: 'FULL_TIME',
            remoteType: 'FULLY_REMOTE',
            location: jobData.city || '远程',
            description: jobData.positionAdvantage,
            applyMethod: `https://www.lagou.com/jobs/${jobData.positionId}.html`,
            source: 'LAGOU',
            sourceUrl: `https://www.lagou.com/jobs/${jobData.positionId}.html`,
            status: 'PUBLISHED',
            publishedAt: new Date(jobData.createTime),
            salaryMin,
            salaryMax,
            salaryCurrency: 'CNY',
            categoryId,
            experienceLevel,
          })
          .returning();

        // Add skills
        if (jobData.companyLabelList) {
          for (const skill of jobData.companyLabelList) {
            const skillId = await getOrCreateSkill(skill);
            await db.insert(jobSkillRelations).values({
              jobId: newJob.id,
              skillId,
            });
          }
        }

        successCount++;
      } catch (error) {
        console.error('Error saving Lagou job:', error);
        failCount++;
      }
    }
    */

    console.log("Lagou crawler not fully implemented - requires API credentials");

    return {
      success: successCount,
      failed: failCount,
      total: 0,
    };
  } catch (error) {
    console.error("Error crawling Lagou:", error);
    throw error;
  }
}
