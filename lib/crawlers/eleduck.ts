import axios, { AxiosError } from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";
import { extractKeywords, slugify } from "@/lib/utils";

// Eleduck API
const ELEDUCK_API_BASE = "https://svc.eleduck.com/api/v1";
const CATEGORY_JOB = 5; // 招聘&找人
const TAG_REMOTE = 17; // 远程工作
const TAG_ONLINE_PARTTIME = 18; // 线上兼职

interface EleduckTag {
  id: number;
  name: string;
  category: string;
}

interface EleduckCategory {
  id: number;
  name: string;
  code: string;
}

interface EleduckAuthor {
  id: string;
  nickname: string;
  avatar_url: string;
}

interface EleduckPost {
  id: string;
  title: string;
  full_title: string;
  summary: string;
  content: string;
  closed: boolean;
  published_at: string;
  modified_at: string;
  visibility: string;
  views_count: number;
  comments_count: number;
  upvotes_count: number;
  marks_count: number;
  category: EleduckCategory;
  tags: EleduckTag[];
  author: EleduckAuthor;
}

interface EleduckApiResponse {
  posts: EleduckPost[];
  pager: {
    total_pages: number;
    current_page: number;
    total_count: number;
    limit_value: number;
  };
}

export async function crawlEleduck(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  let allRemoteJobs: EleduckPost[] = [];

  try {
    console.log("Fetching jobs from Eleduck API...");

    // Fetch first 5 pages to get recent jobs (~125 posts)
    const pagesToFetch = 5;

    for (let page = 1; page <= pagesToFetch; page++) {
      try {
        console.log(`Fetching page ${page}...`);

        const response = await axios.get<EleduckApiResponse>(`${ELEDUCK_API_BASE}/posts`, {
          params: {
            category: CATEGORY_JOB,
            page: page,
          },
          headers: {
            Accept: "application/json",
            "User-Agent": "RemoteJobs-Aggregator/1.0",
          },
          timeout: 10000,
        });

        const posts = response.data.posts || [];
        console.log(`  Page ${page}: ${posts.length} posts`);

        if (posts.length === 0) {
          console.log("  No more posts, stopping pagination");
          break;
        }

        // Filter for remote jobs
        const remoteJobs = posts.filter((post) => {
          // Must not be closed
          if (post.closed) return false;

          // Must have remote work tag (ID 17 or 18)
          const hasRemoteTag = post.tags.some(
            (tag) => tag.id === TAG_REMOTE || tag.id === TAG_ONLINE_PARTTIME
          );
          if (!hasRemoteTag) return false;

          // Filter by published date (within 30 days)
          const publishedDate = new Date(post.published_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (publishedDate < thirtyDaysAgo) return false;

          return true;
        });

        console.log(`  Found ${remoteJobs.length} remote jobs on page ${page}`);
        allRemoteJobs = allRemoteJobs.concat(remoteJobs);

        // Small delay to respect rate limits (1 second)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: unknown) {
        const err = error as AxiosError;
        console.error(`Error fetching page ${page}:`, err.response?.status, err.message);
        // Continue with other pages even if one fails
        break;
      }
    }

    console.log(`Total remote jobs found: ${allRemoteJobs.length}`);

    // Process each job
    for (const post of allRemoteJobs) {
      try {
        // Check if job already exists by sourceUrl
        const sourceUrl = `https://eleduck.com/posts/${post.id}`;
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          // Job already exists, skip
          continue;
        }

        // Parse job data
        const { companyName, jobTitle, keywords } = parseEleduckPost(post);

        // Determine job type
        const jobType = determineJobType(post);

        // Determine remote type
        const remoteType = determineRemoteType(post);

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobTitle,
            companyName,
            type: jobType,
            remoteType,
            description: post.content || post.summary || post.full_title,
            applyMethod: sourceUrl,
            source: "ELEDUCK",
            sourceUrl,
            status: post.closed ? "CLOSED" : "PUBLISHED",
            publishedAt: new Date(post.published_at),
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
        console.error("Error saving Eleduck job:", error);
        failCount++;
      }
    }

    return {
      success: successCount,
      failed: failCount,
      total: allRemoteJobs.length,
    };
  } catch (error) {
    console.error("Error crawling Eleduck:", error);
    throw error;
  }
}

/**
 * Parse Eleduck post to extract company name, job title, and keywords
 */
function parseEleduckPost(post: EleduckPost): {
  companyName: string;
  jobTitle: string;
  keywords: string[];
} {
  // Eleduck posts usually have the format:
  // "[公司名] 招聘 职位名称"
  // "招聘 职位名称 - 公司名"
  // "公司名 招聘 职位名称"

  let companyName = "Unknown Company";
  let jobTitle = post.full_title || post.title;
  const keywords: string[] = [];

  // Try to extract company name from brackets
  const bracketMatch = jobTitle.match(/\[([^\]]+)\]|【([^】]+)】/);
  if (bracketMatch) {
    companyName = bracketMatch[1] || bracketMatch[2];
    jobTitle = jobTitle.replace(bracketMatch[0], "").trim();
  }

  // Try to extract company from " - " pattern
  if (companyName === "Unknown Company") {
    const dashMatch = jobTitle.match(/(.+)\s*-\s*([^-]+)$/);
    if (dashMatch) {
      // Check which side is likely the company
      if (dashMatch[2].length < 30 && !dashMatch[2].includes("招聘")) {
        companyName = dashMatch[2].trim();
        jobTitle = dashMatch[1].trim();
      }
    }
  }

  // Extract keywords from tags
  for (const tag of post.tags) {
    // Skip work type tags
    if (
      [16, 17, 18, 19].includes(tag.id) ||
      tag.category === "work_type" ||
      tag.category === "hiring_type"
    ) {
      continue;
    }

    // Add relevant tags as keywords (filter out invalid ones)
    if (tag.category === "job_category" || tag.category === "field" || tag.category === "city") {
      // Only add if tag name is valid (has alphanumeric characters)
      if (tag.name && tag.name.length > 0 && /[\w\u4e00-\u9fa5]/.test(tag.name)) {
        keywords.push(tag.name);
      }
    }
  }

  // Extract common tech keywords from title and content
  const commonKeywords = [
    "React",
    "Vue",
    "Angular",
    "Node",
    "Python",
    "Java",
    "Go",
    "Golang",
    "Rust",
    "TypeScript",
    "JavaScript",
    "Frontend",
    "Backend",
    "Fullstack",
    "全栈",
    "前端",
    "后端",
    "DevOps",
    "UI/UX",
    "Product",
    "产品",
    "设计",
    "运营",
  ];

  const searchText = `${post.full_title} ${post.title} ${post.summary}`.toLowerCase();
  for (const keyword of commonKeywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  }

  // If no keywords found, extract from title
  if (keywords.length === 0) {
    keywords.push(...extractKeywords(jobTitle).slice(0, 5));
  }

  // Clean up job title
  jobTitle = jobTitle
    .replace(/招聘|诚聘|寻找|急招|高薪|诚邀/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Filter out invalid keywords
  const validKeywords = Array.from(new Set(keywords))
    .filter((k) => k && k.length > 0 && /[\w\u4e00-\u9fa5]/.test(k))
    .slice(0, 10);

  return {
    companyName,
    jobTitle: jobTitle || post.full_title || post.title,
    keywords: validKeywords.length > 0 ? validKeywords : ["远程工作"], // Fallback to default tag
  };
}

/**
 * Determine job type from Eleduck post
 */
function determineJobType(
  post: EleduckPost
): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  const searchText =
    `${post.full_title} ${post.title} ${post.summary} ${post.content}`.toLowerCase();

  // Check for part-time/freelance
  const isPartTime = post.tags.some((tag) => tag.id === TAG_ONLINE_PARTTIME);
  if (isPartTime) return "PART_TIME";

  // Check content for keywords
  if (searchText.includes("兼职") || searchText.includes("part-time")) {
    return "PART_TIME";
  }

  if (searchText.includes("实习") || searchText.includes("intern")) {
    return "INTERNSHIP";
  }

  if (
    searchText.includes("外包") ||
    searchText.includes("零活") ||
    searchText.includes("合同") ||
    searchText.includes("contract")
  ) {
    return "CONTRACT";
  }

  // Default to full-time
  return "FULL_TIME";
}

/**
 * Determine remote type from Eleduck post
 */
function determineRemoteType(post: EleduckPost): "FULLY_REMOTE" | "HYBRID" | "OCCASIONAL" {
  // Check for remote work tag
  const isFullyRemote = post.tags.some((tag) => tag.id === TAG_REMOTE);
  if (isFullyRemote) return "FULLY_REMOTE";

  // Check for online part-time (usually remote)
  const isOnlinePartTime = post.tags.some((tag) => tag.id === TAG_ONLINE_PARTTIME);
  if (isOnlinePartTime) return "FULLY_REMOTE";

  // Check content for remote keywords
  const searchText =
    `${post.full_title} ${post.title} ${post.summary} ${post.content}`.toLowerCase();
  const hybridKeywords = ["混合", "hybrid", "部分远程"];
  const hasHybrid = hybridKeywords.some((kw) => searchText.includes(kw));

  if (hasHybrid) return "HYBRID";

  // Default to fully remote (since we filtered by remote tags)
  return "FULLY_REMOTE";
}
