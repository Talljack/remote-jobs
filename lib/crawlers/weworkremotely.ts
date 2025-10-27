import { eq } from "drizzle-orm";
import Parser from "rss-parser";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// WeWorkRemotely RSS feeds
const RSS_FEEDS = [
  {
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    category: "engineering.backend", // Default category
  },
  {
    url: "https://weworkremotely.com/categories/remote-design-jobs.rss",
    category: "product.designer",
  },
  {
    url: "https://weworkremotely.com/categories/remote-marketing-jobs.rss",
    category: "business.marketing",
  },
  {
    url: "https://weworkremotely.com/categories/remote-customer-support.rss",
    category: "business.customer_support",
  },
  {
    url: "https://weworkremotely.com/categories/remote-sales-jobs.rss",
    category: "business.sales",
  },
  {
    url: "https://weworkremotely.com/categories/remote-product-jobs.rss",
    category: "product.manager",
  },
];

/**
 * Parse job title to extract company and position
 * Format: "Company Name: Position Title"
 */
function parseJobTitle(title: string): { company: string; position: string } {
  const parts = title.split(":");

  if (parts.length >= 2) {
    return {
      company: parts[0].trim(),
      position: parts.slice(1).join(":").trim(),
    };
  }

  return {
    company: "Unknown Company",
    position: title,
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
    "Laravel",
    "C++",
    "C#",
    ".NET",
    "Swift",
    "Kotlin",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "GraphQL",
    "REST",
    "Git",
    "Figma",
    "Sketch",
    "Photoshop",
    "Illustrator",
  ];

  const foundSkills: string[] = [];
  const lowerDescription = description.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerDescription.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)]; // Remove duplicates
}

/**
 * Detect experience level from title/description
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
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) return "ENTRY";
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
 * Get or create skill
 */
async function getOrCreateSkill(skillName: string): Promise<string> {
  const skillSlug = slugify(skillName);

  // Check if skill exists
  let [skill] = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);

  // Create skill if doesn't exist
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
    // Increment skill count
    await db
      .update(skills)
      .set({ count: skill.count + 1 })
      .where(eq(skills.id, skill.id));
  }

  return skill.id;
}

/**
 * Crawl WeWorkRemotely RSS feeds
 */
export async function crawlWeWorkRemotely(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  let totalJobs = 0;

  const parser = new Parser();

  try {
    console.log("Fetching jobs from WeWorkRemotely RSS feeds...");

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`Parsing feed: ${feed.url}`);

        const rssFeed = await parser.parseURL(feed.url);
        const items = rssFeed.items || [];

        console.log(`  Found ${items.length} items in feed`);

        // Filter for jobs posted in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const item of items) {
          totalJobs++;

          try {
            const pubDate = item.isoDate ? new Date(item.isoDate) : new Date(item.pubDate || "");

            // Skip old jobs
            if (pubDate < thirtyDaysAgo) {
              continue;
            }

            const sourceUrl = item.link || item.guid || "";

            if (!sourceUrl || !item.title) {
              console.warn("Skipping item without link or title");
              continue;
            }

            // Check if job already exists
            const existingJob = await db
              .select()
              .from(jobs)
              .where(eq(jobs.sourceUrl, sourceUrl))
              .limit(1);

            if (existingJob.length > 0) {
              // Job already exists, skip
              continue;
            }

            // Parse title
            const { company, position } = parseJobTitle(item.title);
            const description = item.contentSnippet || item.content || position;

            // Get category
            const categoryId = await getCategoryId(feed.category);

            // Detect experience level
            const experienceLevel = detectExperienceLevel(position, description);

            // Determine job type
            const jobType = determineJobType(position, description);

            // Create job
            const [newJob] = await db
              .insert(jobs)
              .values({
                title: position,
                companyName: company,
                type: jobType,
                remoteType: "FULLY_REMOTE",
                location: "Worldwide",
                description,
                applyMethod: sourceUrl,
                source: "WEWORKREMOTELY",
                sourceUrl,
                status: "PUBLISHED",
                publishedAt: pubDate,
                categoryId,
                experienceLevel,
              })
              .returning();

            // Extract and add skills
            const detectedSkills = extractSkills(description);
            for (const skillName of detectedSkills) {
              try {
                const skillId = await getOrCreateSkill(skillName);

                // Create job-skill relation
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
            console.error("Error saving WeWorkRemotely job:", error);
            failCount++;
          }
        }

        // Small delay between feeds
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error parsing feed ${feed.url}:`, error);
      }
    }

    console.log(`WeWorkRemotely crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: totalJobs,
    };
  } catch (error) {
    console.error("Error crawling WeWorkRemotely:", error);
    throw error;
  }
}
