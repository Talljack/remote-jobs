import axios from "axios";
import * as cheerio from "cheerio";
import { eq } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";
import { extractKeywords, slugify } from "@/lib/utils";

const V2EX_REMOTE_JOBS_URL = "https://www.v2ex.com/go/jobs?tab=remote";

interface V2EXJob {
  title: string;
  content: string;
  url: string;
  author: string;
  publishedAt: Date;
}

export async function crawlV2EX(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  const jobsList: V2EXJob[] = [];

  try {
    // Fetch the page
    const response = await axios.get(V2EX_REMOTE_JOBS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Parse job listings
    $(".cell.item").each((_, element) => {
      try {
        const $el = $(element);
        const $title = $el.find(".item_title a");
        const title = $title.text().trim();
        const url = "https://www.v2ex.com" + $title.attr("href");
        const author = $el.find(".small.fade strong a").text().trim();
        const timeText = $el.find(".small.fade").text();

        // Parse relative time
        let publishedAt = new Date();
        if (timeText.includes("分钟前")) {
          const minutes = parseInt(timeText.match(/(\d+)\s*分钟前/)?.[1] || "0");
          publishedAt = new Date(Date.now() - minutes * 60 * 1000);
        } else if (timeText.includes("小时前")) {
          const hours = parseInt(timeText.match(/(\d+)\s*小时前/)?.[1] || "0");
          publishedAt = new Date(Date.now() - hours * 60 * 60 * 1000);
        } else if (timeText.includes("天前")) {
          const days = parseInt(timeText.match(/(\d+)\s*天前/)?.[1] || "0");
          publishedAt = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        }

        if (title && url) {
          jobsList.push({
            title,
            content: "", // Will fetch from detail page if needed
            url,
            author,
            publishedAt,
          });
        }
      } catch (error) {
        console.error("Error parsing V2EX job item:", error);
        failCount++;
      }
    });

    // Process each job
    for (const jobData of jobsList) {
      try {
        // Check if job already exists
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, jobData.url))
          .limit(1);

        if (existingJob.length > 0) {
          // Job already exists, skip
          continue;
        }

        // Parse job title to extract company and position
        const { companyName, jobTitle, keywords } = parseV2EXTitle(jobData.title);

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobTitle,
            companyName,
            type: "FULL_TIME", // Default, can be improved with better parsing
            remoteType: "FULLY_REMOTE",
            description: jobData.content || jobData.title,
            applyMethod: jobData.url,
            source: "V2EX",
            sourceUrl: jobData.url,
            status: "PUBLISHED",
            publishedAt: jobData.publishedAt,
          })
          .returning();

        // Create or get tags
        for (const keyword of keywords) {
          const tagSlug = slugify(keyword);

          // Check if tag exists
          let [tag] = await db.select().from(jobTags).where(eq(jobTags.slug, tagSlug)).limit(1);

          // Create tag if doesn't exist
          if (!tag) {
            [tag] = await db
              .insert(jobTags)
              .values({
                name: keyword,
                slug: tagSlug,
                count: 1,
              })
              .returning();
          } else {
            // Increment tag count
            await db
              .update(jobTags)
              .set({ count: tag.count + 1 })
              .where(eq(jobTags.id, tag.id));
          }

          // Create job-tag relation
          await db.insert(jobTagRelations).values({
            jobId: newJob.id,
            tagId: tag.id,
          });
        }

        successCount++;
      } catch (error) {
        console.error("Error saving V2EX job:", error);
        failCount++;
      }
    }

    return {
      success: successCount,
      failed: failCount,
      total: jobsList.length,
    };
  } catch (error) {
    console.error("Error crawling V2EX:", error);
    throw error;
  }
}

function parseV2EXTitle(title: string): {
  companyName: string;
  jobTitle: string;
  keywords: string[];
} {
  // Common patterns in V2EX job titles:
  // "[公司名] 招聘 职位名称"
  // "招聘 职位名称 - 公司名"
  // "公司名 招聘 职位名称 (技能1/技能2)"

  let companyName = "Unknown Company";
  let jobTitle = title;
  let keywords: string[] = [];

  // Try to extract company name from brackets
  const bracketMatch = title.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    companyName = bracketMatch[1];
    title = title.replace(bracketMatch[0], "").trim();
  }

  // Try to extract keywords from parentheses
  const parensMatch = title.match(/\(([^)]+)\)/);
  if (parensMatch) {
    keywords = parensMatch[1].split(/[/,、]/).map((k) => k.trim());
    title = title.replace(parensMatch[0], "").trim();
  }

  // Extract common tech keywords
  const commonKeywords = [
    "React",
    "Vue",
    "Angular",
    "Node",
    "Python",
    "Java",
    "Go",
    "Rust",
    "TypeScript",
    "JavaScript",
    "Frontend",
    "Backend",
    "Fullstack",
    "DevOps",
    "UI/UX",
    "Product",
  ];

  for (const keyword of commonKeywords) {
    if (title.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  }

  // If no keywords found, extract from title
  if (keywords.length === 0) {
    keywords = extractKeywords(title).slice(0, 5);
  }

  jobTitle = title.replace(/招聘|诚聘|寻找/g, "").trim();

  return {
    companyName,
    jobTitle: jobTitle || title,
    keywords: Array.from(new Set(keywords)),
  };
}
