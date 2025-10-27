import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// GitHub API
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "ruanyf";
const REPO_NAME = "weekly";

// Get the latest job issue number from the URL pattern
// Format: https://github.com/ruanyf/weekly/issues/XXXX
// We'll fetch the latest issues and find the job posting one

interface GitHubComment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
  html_url: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  html_url: string;
  comments: number;
}

interface ParsedJob {
  companyName: string;
  positions: string[];
  location: string;
  description: string;
  isRemote: boolean;
  contactInfo: string;
  rawText: string;
}

/**
 * Get the latest "招聘" issue
 */
async function getLatestJobIssue(): Promise<GitHubIssue | null> {
  try {
    const response = await axios.get<GitHubIssue[]>(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        params: {
          state: "open",
          per_page: 10,
          sort: "created",
          direction: "desc",
        },
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "RemoteJobs-Aggregator/1.0",
        },
        timeout: 10000,
      }
    );

    // Find the issue with "招聘" in the title
    const jobIssue = response.data.find(
      (issue) => issue.title.includes("招聘") || issue.title.includes("求职")
    );

    return jobIssue || null;
  } catch (error) {
    console.error("Error fetching GitHub issues:", error);
    return null;
  }
}

/**
 * Fetch comments from a GitHub issue
 */
async function getIssueComments(issueNumber: number): Promise<GitHubComment[]> {
  try {
    const comments: GitHubComment[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await axios.get<GitHubComment[]>(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments`,
        {
          params: {
            page,
            per_page: perPage,
          },
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "RemoteJobs-Aggregator/1.0",
          },
          timeout: 10000,
        }
      );

      if (response.data.length === 0) break;

      comments.push(...response.data);

      // If we got less than perPage, we're done
      if (response.data.length < perPage) break;

      page++;

      // Rate limiting - wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return comments;
  } catch (error) {
    console.error(`Error fetching comments for issue ${issueNumber}:`, error);
    return [];
  }
}

/**
 * Parse job posting from comment text
 */
function parseJobPosting(commentBody: string): ParsedJob | null {
  // Basic validation - must have some key indicators
  const hasJobKeywords =
    commentBody.includes("招聘") ||
    commentBody.includes("公司") ||
    commentBody.includes("岗位") ||
    commentBody.includes("职位");

  if (!hasJobKeywords) return null;

  // Extract company name (usually in bold or at the beginning)
  let companyName = "Unknown Company";
  const companyMatch =
    commentBody.match(/公司[：:]\s*[*]{0,2}([^*\n]+)[*]{0,2}/i) ||
    commentBody.match(/^[*]{0,2}([^：:\n]{2,30})[*]{0,2}[：:]/m) ||
    commentBody.match(/[*]{2}([^*\n]{2,20})[*]{2}/);

  if (companyMatch) {
    companyName = companyMatch[1].trim();
  }

  // Extract positions
  const positions: string[] = [];
  const positionPatterns = [
    /职位[：:]\s*([^\n]+)/gi,
    /岗位[：:]\s*([^\n]+)/gi,
    /招聘[：:]\s*([^\n]+)/gi,
    /^[*-]\s*([^\n]+工程师|[^\n]+开发|[^\n]+设计师|[^\n]+经理)/gim,
  ];

  for (const pattern of positionPatterns) {
    const matches = commentBody.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        positions.push(match[1].trim());
      }
    }
  }

  // Extract location
  let location = "未指定";
  const locationMatch =
    commentBody.match(/地点[：:]\s*([^\n]+)/i) ||
    commentBody.match(/城市[：:]\s*([^\n]+)/i) ||
    commentBody.match(/工作地[：:]\s*([^\n]+)/i);

  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  // Check if remote
  const isRemote =
    commentBody.toLowerCase().includes("远程") ||
    commentBody.toLowerCase().includes("remote") ||
    commentBody.toLowerCase().includes("在家") ||
    commentBody.toLowerCase().includes("wfh");

  // Extract contact info
  let contactInfo = "";
  const contactMatch =
    commentBody.match(/邮箱[：:]\s*([^\s\n]+@[^\s\n]+)/i) ||
    commentBody.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

  if (contactMatch) {
    contactInfo = contactMatch[1];
  }

  return {
    companyName,
    positions: positions.length > 0 ? positions : ["职位信息请查看详情"],
    location,
    description: commentBody,
    isRemote,
    contactInfo,
    rawText: commentBody,
  };
}

/**
 * Extract skills from job description
 */
function extractSkills(description: string): string[] {
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Python",
    "Django",
    "Flask",
    "Java",
    "Spring",
    "Go",
    "Golang",
    "Rust",
    "Ruby",
    "Rails",
    "PHP",
    "C++",
    "C#",
    ".NET",
    "Swift",
    "Kotlin",
    "AWS",
    "Docker",
    "Kubernetes",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
  ];

  const foundSkills: string[] = [];
  const lowerDescription = description.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerDescription.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)];
}

/**
 * Determine job category from description
 */
async function getCategoryFromDescription(description: string): Promise<string | null> {
  const lowerDesc = description.toLowerCase();

  // Category keywords mapping
  const categoryMap: Record<string, string[]> = {
    "engineering.frontend": ["前端", "frontend", "react", "vue", "angular"],
    "engineering.backend": ["后端", "backend", "java", "python", "go", "golang", "node"],
    "engineering.fullstack": ["全栈", "fullstack", "full stack"],
    "engineering.mobile": ["移动", "mobile", "ios", "android", "flutter"],
    "engineering.devops": ["devops", "运维", "sre"],
    "product.designer": ["设计", "designer", "ui", "ux"],
    "product.manager": ["产品", "product manager", "pm"],
    "business.marketing": ["营销", "marketing", "增长", "growth"],
    "business.sales": ["销售", "sales"],
  };

  for (const [categorySlug, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
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
 * Crawl Ruanyf Weekly job postings
 */
export async function crawlRuanyfWeekly(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;

  try {
    console.log("Fetching latest job issue from Ruanyf Weekly...");

    // Get the latest job posting issue
    const jobIssue = await getLatestJobIssue();

    if (!jobIssue) {
      console.log("No job posting issue found");
      return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Found job issue #${jobIssue.number}: ${jobIssue.title}`);
    console.log(`Issue has ${jobIssue.comments} comments`);

    // Fetch all comments
    const comments = await getIssueComments(jobIssue.number);
    console.log(`Fetched ${comments.length} comments`);

    // Filter comments from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentComments = comments.filter((comment) => {
      const commentDate = new Date(comment.created_at);
      return commentDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentComments.length} recent comments (last 30 days)`);

    // Process each comment
    for (const comment of recentComments) {
      try {
        // Parse job posting
        const jobData = parseJobPosting(comment.body);

        if (!jobData) {
          // Not a valid job posting
          continue;
        }

        // Only process remote jobs
        if (!jobData.isRemote) {
          continue;
        }

        // Process each position in the posting
        for (const position of jobData.positions) {
          try {
            const sourceUrl = comment.html_url;

            // Check if job already exists
            const existingJob = await db
              .select()
              .from(jobs)
              .where(eq(jobs.sourceUrl, sourceUrl))
              .limit(1);

            if (existingJob.length > 0) {
              continue;
            }

            // Get category
            const categoryId = await getCategoryFromDescription(jobData.rawText);

            // Create job
            const [newJob] = await db
              .insert(jobs)
              .values({
                title: position,
                companyName: jobData.companyName,
                type: "FULL_TIME", // Default
                remoteType: "FULLY_REMOTE",
                location: jobData.location,
                description: jobData.description,
                applyMethod: jobData.contactInfo || sourceUrl,
                source: "RUANYF_WEEKLY",
                sourceUrl,
                status: "PUBLISHED",
                publishedAt: new Date(comment.created_at),
                categoryId,
              })
              .returning();

            // Extract and add skills
            const detectedSkills = extractSkills(jobData.rawText);
            for (const skillName of detectedSkills) {
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
            console.error("Error saving job:", error);
            failCount++;
          }
        }
      } catch (error) {
        console.error("Error processing comment:", error);
        failCount++;
      }
    }

    console.log(`Ruanyf Weekly crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentComments.length,
    };
  } catch (error) {
    console.error("Error crawling Ruanyf Weekly:", error);
    throw error;
  }
}
