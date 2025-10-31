import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// Jobicy API v2
const JOBICY_API_URL = "https://jobicy.com/api/v2/remote-jobs";

interface JobicyJob {
  id: number;
  url: string;
  jobSlug: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
}

interface JobicyResponse {
  jobCount: number;
  jobs: JobicyJob[];
}

/**
 * Category mapping from Jobicy industry to our categories
 */
const INDUSTRY_TO_CATEGORY: Record<string, string> = {
  // Engineering
  "Software Engineering": "engineering.fullstack",
  "DevOps / Sysadmin": "engineering.devops",
  "Quality Assurance": "engineering.qa",
  Cybersecurity: "engineering.security",

  // Data & AI
  "Data Science": "data.science",
  "Data Analyst": "data.analyst",

  // Product & Design
  Product: "product.manager",
  Design: "product.designer",
  UX: "ux.designer",

  // Business
  Marketing: "business.marketing",
  Sales: "business.sales",
  "Customer Success": "business.customer_success",
  "Customer Support": "business.customer_support",

  // Content
  "Content & Editorial": "content.writing",
};

/**
 * Map Jobicy job level to our experience level
 */
function mapExperienceLevel(
  jobLevel: string
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  const levelLower = jobLevel.toLowerCase();

  if (levelLower.includes("principal") || levelLower.includes("distinguished")) return "PRINCIPAL";
  if (levelLower.includes("staff")) return "STAFF";
  if (levelLower.includes("director") || levelLower.includes("lead") || levelLower.includes("head"))
    return "LEAD";
  if (levelLower.includes("senior")) return "SENIOR";
  if (levelLower.includes("junior") || levelLower.includes("entry")) return "ENTRY";
  if (levelLower.includes("mid") || levelLower.includes("intermediate")) return "MID";

  return null;
}

/**
 * Map Jobicy job type to our job type
 */
function mapJobType(jobTypes: string[]): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  const types = jobTypes.map((t) => t.toLowerCase());

  if (types.some((t) => t.includes("intern"))) return "INTERNSHIP";
  if (types.some((t) => t.includes("part-time"))) return "PART_TIME";
  if (types.some((t) => t.includes("contract") || t.includes("freelance"))) return "CONTRACT";

  return "FULL_TIME";
}

/**
 * Detect category from industry
 */
async function detectCategory(industries: string[]): Promise<string | null> {
  for (const industry of industries) {
    const categorySlug = INDUSTRY_TO_CATEGORY[industry];
    if (categorySlug) {
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
 * Extract skills from description
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
 * Crawl Jobicy API
 */
export async function crawlJobicy(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  let totalJobs = 0;

  try {
    console.log("Fetching jobs from Jobicy API...");

    const response = await axios.get<JobicyResponse>(JOBICY_API_URL, {
      params: {
        count: 100, // Get up to 100 jobs
      },
      timeout: 10000,
    });

    const jobsData = response.data.jobs || [];
    totalJobs = jobsData.length;

    console.log(`Found ${totalJobs} jobs from Jobicy`);

    // Filter for jobs posted in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const jobData of jobsData) {
      try {
        const pubDate = new Date(jobData.pubDate);

        // Skip old jobs
        if (pubDate < thirtyDaysAgo) {
          continue;
        }

        // Check if job already exists
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, jobData.url))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        // Detect category
        const categoryId = await detectCategory(jobData.jobIndustry);

        // Map experience level
        const experienceLevel = mapExperienceLevel(jobData.jobLevel);

        // Map job type
        const jobType = mapJobType(jobData.jobType);

        // Strip HTML from description
        const description = jobData.jobDescription.replace(/<[^>]*>/g, "");

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.jobTitle,
            companyName: jobData.companyName,
            companyLogo: jobData.companyLogo,
            type: jobType,
            remoteType: "FULLY_REMOTE", // Jobicy only lists remote jobs
            location: jobData.jobGeo || "Worldwide",
            description,
            applyMethod: jobData.url,
            source: "JOBICY",
            sourceUrl: jobData.url,
            status: "PUBLISHED",
            publishedAt: pubDate,
            categoryId,
            experienceLevel,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            salaryCurrency: jobData.salaryCurrency || "USD",
          })
          .returning();

        // Extract and add skills
        const detectedSkills = extractSkills(description);
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
        console.error("Error saving Jobicy job:", error);
        failCount++;
      }
    }

    console.log(`Jobicy crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: totalJobs,
    };
  } catch (error) {
    console.error("Error crawling Jobicy:", error);
    throw error;
  }
}
