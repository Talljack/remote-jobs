import axios, { AxiosError } from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";
import { extractKeywords, slugify } from "@/lib/utils";

// V2EX API v2 (requires Personal Access Token)
const V2EX_API_BASE = "https://www.v2ex.com/api/v2";
const V2EX_TOKEN = process.env.V2EX_API_TOKEN;

interface V2EXApiTopic {
  id: number;
  title: string;
  content: string;
  content_rendered: string;
  url: string;
  created: number; // Unix timestamp
  last_modified: number;
  last_touched: number;
  replies: number;
  last_reply_by?: string;
  syntax: number;
}

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
    if (!V2EX_TOKEN) {
      console.error("V2EX_API_TOKEN not found in environment variables");
      throw new Error("V2EX API token is required");
    }

    console.log("Fetching jobs from V2EX API v2...");

    // Fetch multiple pages to get more jobs (API returns ~20 per page)
    const pagesToFetch = 3; // Fetch first 3 pages (~60 jobs)
    let allTopics: V2EXApiTopic[] = [];

    for (let page = 1; page <= pagesToFetch; page++) {
      try {
        console.log(`Fetching page ${page}...`);

        const response = await axios.get<{ result: V2EXApiTopic[] }>(
          `${V2EX_API_BASE}/nodes/jobs/topics?p=${page}`,
          {
            headers: {
              Authorization: `Bearer ${V2EX_TOKEN}`,
              "User-Agent": "RemoteJobs-Aggregator/1.0",
              Accept: "application/json",
            },
            timeout: 10000,
          }
        );

        const topics = response.data.result || [];
        console.log(`  Page ${page}: ${topics.length} topics`);

        if (topics.length === 0) {
          console.log("  No more topics, stopping pagination");
          break;
        }

        allTopics = allTopics.concat(topics);

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: unknown) {
        const err = error as AxiosError;
        console.error(`Error fetching page ${page}:`, err.response?.status, err.message);
        if (err.response?.status === 401) {
          throw new Error("Invalid V2EX API token");
        }
        // Continue with other pages even if one fails
        break;
      }
    }

    console.log(`Total fetched: ${allTopics.length} topics from V2EX`);

    // Filter out job-seeking posts and collect valid jobs
    for (const topic of allTopics) {
      const titleLower = topic.title.toLowerCase();

      // Skip job seeking posts (求职)
      const isJobSeeking = titleLower.includes("求职") || titleLower.includes("[求职]");
      if (isJobSeeking) {
        continue;
      }

      // Include all non-seeking job posts from the jobs node
      // Remote type will be determined later based on content keywords
      jobsList.push({
        title: topic.title,
        content: topic.content || "",
        url: topic.url,
        author: topic.last_reply_by || "V2EX User", // V2 API doesn't include original poster
        publishedAt: new Date(topic.created * 1000), // Convert Unix timestamp to Date
      });
    }

    console.log(`Filtered to ${jobsList.length} job postings (excluding job-seeking)`);

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

        // Determine remote type based on content
        const remoteKeywords = ["远程", "remote", "居家", "在家", "wfh"];
        const contentLower = (jobData.content + jobData.title).toLowerCase();
        const hasRemote = remoteKeywords.some((kw) => contentLower.includes(kw));

        // Determine job type
        let jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" = "FULL_TIME";
        if (contentLower.includes("兼职") || contentLower.includes("part-time")) {
          jobType = "PART_TIME";
        } else if (contentLower.includes("实习") || contentLower.includes("intern")) {
          jobType = "INTERNSHIP";
        } else if (contentLower.includes("合同") || contentLower.includes("contract")) {
          jobType = "CONTRACT";
        }

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobTitle,
            companyName,
            type: jobType,
            remoteType: hasRemote ? "FULLY_REMOTE" : "OCCASIONAL", // Mark as occasional if not explicitly remote
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
