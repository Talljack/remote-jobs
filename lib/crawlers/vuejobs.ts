import axios from "axios";
import { eq } from "drizzle-orm";

import { db, jobs, jobCategories, skills, jobSkillRelations } from "@/db";
import { slugify } from "@/lib/utils";

// VueJobs API
const VUEJOBS_API_URL = "https://app.vuejobs.com/posts/items";

interface VueJobsCompany {
  name: string;
  avatar?: string;
  verified?: boolean;
}

interface VueJobsTaxonomy {
  name: string;
  slug: string;
}

interface VueJobsLocation {
  city?: string;
  state?: string;
  country_code?: string;
}

interface VueJobsPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  company: VueJobsCompany;
  locations?: VueJobsLocation[];
  remote: boolean | "ONLY" | "HYBRID";
  taxonomy?: {
    work_type?: VueJobsTaxonomy[];
    level?: VueJobsTaxonomy[];
  };
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
    period?: string;
  };
  apply_url?: string;
  created_at: string;
  published_at?: string;
}

interface VueJobsApiResponse {
  data: VueJobsPost[];
  meta: {
    total_count: number;
    filter_count: number;
    current_page: number;
    per_page: number;
    total_pages: number;
  };
}

/**
 * Map VueJobs work type to our job type
 */
function mapWorkType(
  workTypes?: VueJobsTaxonomy[]
): "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" {
  if (!workTypes || workTypes.length === 0) return "FULL_TIME";

  const workType = workTypes[0].slug.toLowerCase();

  if (workType.includes("freelance") || workType.includes("contract")) return "CONTRACT";
  if (workType.includes("part")) return "PART_TIME";
  if (workType.includes("intern")) return "INTERNSHIP";

  return "FULL_TIME";
}

/**
 * Map VueJobs remote status to our remote type
 */
function mapRemoteType(
  remote: boolean | "ONLY" | "HYBRID"
): "FULLY_REMOTE" | "HYBRID" | "OCCASIONAL" {
  if (remote === "ONLY" || remote === true) return "FULLY_REMOTE";
  if (remote === "HYBRID") return "HYBRID";
  return "OCCASIONAL";
}

/**
 * Map VueJobs level to our experience level
 */
function mapExperienceLevel(
  levels?: VueJobsTaxonomy[]
): "ENTRY" | "MID" | "SENIOR" | "LEAD" | "STAFF" | "PRINCIPAL" | null {
  if (!levels || levels.length === 0) return null;

  const level = levels[0].slug.toLowerCase();

  if (level.includes("junior")) return "ENTRY";
  if (level.includes("mid")) return "MID";
  if (level.includes("senior")) return "SENIOR";
  if (level.includes("lead")) return "LEAD";
  if (level.includes("staff")) return "STAFF";
  if (level.includes("principal")) return "PRINCIPAL";

  return null;
}

/**
 * Format location from VueJobs data
 */
function formatLocation(locations?: VueJobsLocation[]): string {
  if (!locations || locations.length === 0) return "Remote";

  const location = locations[0];
  const parts = [];

  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.country_code) parts.push(location.country_code);

  return parts.length > 0 ? parts.join(", ") : "Remote";
}

/**
 * Extract Vue-related skills
 */
function extractVueSkills(description: string, title: string): string[] {
  const commonSkills = [
    "Vue.js",
    "Vue",
    "Nuxt.js",
    "Nuxt",
    "Vuex",
    "Pinia",
    "Vuetify",
    "Quasar",
    "TypeScript",
    "JavaScript",
    "React",
    "Angular",
    "Node.js",
    "Express",
    "Nest.js",
    "Laravel",
    "PHP",
    "Python",
    "Django",
    "Tailwind",
    "Bootstrap",
    "CSS",
    "HTML",
    "GraphQL",
    "REST",
    "API",
    "Git",
    "Docker",
    "AWS",
    "Firebase",
  ];

  const text = `${title} ${description}`.toLowerCase();
  const foundSkills: string[] = [];

  for (const skill of commonSkills) {
    if (text.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  // Always include Vue.js if not found
  if (!foundSkills.some((s) => s.toLowerCase().includes("vue"))) {
    foundSkills.unshift("Vue.js");
  }

  return [...new Set(foundSkills)].slice(0, 10); // Max 10 skills
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
 * Get category ID for frontend development
 */
async function getFrontendCategoryId(): Promise<string | null> {
  const [category] = await db
    .select()
    .from(jobCategories)
    .where(eq(jobCategories.slug, "engineering.frontend"))
    .limit(1);

  return category?.id || null;
}

/**
 * Crawl VueJobs remote positions
 */
export async function crawlVueJobs(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let successCount = 0;
  let failCount = 0;
  let allJobs: VueJobsPost[] = [];

  try {
    console.log("Fetching jobs from VueJobs API...");

    // Fetch multiple pages of remote jobs
    const pagesToFetch = 3; // Fetch first 3 pages (~45 jobs)

    for (let page = 1; page <= pagesToFetch; page++) {
      try {
        console.log(`Fetching page ${page}...`);

        const response = await axios.get<VueJobsApiResponse>(VUEJOBS_API_URL, {
          params: {
            page,
            "filter[remote]": "ONLY", // Only fully remote jobs
          },
          headers: {
            Accept: "application/json",
            "User-Agent": "RemoteJobs-Aggregator/1.0",
          },
          timeout: 10000,
        });

        const posts = response.data.data || [];
        console.log(`  Page ${page}: ${posts.length} jobs`);

        if (posts.length === 0) {
          console.log("  No more jobs, stopping pagination");
          break;
        }

        allJobs = allJobs.concat(posts);

        // Check if we've reached the last page
        if (page >= response.data.meta.total_pages) {
          console.log("  Reached last page");
          break;
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    console.log(`Total jobs fetched: ${allJobs.length}`);

    // Filter jobs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = allJobs.filter((job) => {
      const publishDate = new Date(job.published_at || job.created_at);
      return publishDate >= thirtyDaysAgo;
    });

    console.log(`Filtered to ${recentJobs.length} recent jobs (last 30 days)`);

    // Process each job
    for (const jobData of recentJobs) {
      try {
        const sourceUrl = `https://vuejobs.com/jobs/${jobData.slug}`;

        // Check if job already exists
        const existingJob = await db
          .select()
          .from(jobs)
          .where(eq(jobs.sourceUrl, sourceUrl))
          .limit(1);

        if (existingJob.length > 0) {
          continue;
        }

        // Get frontend category
        const categoryId = await getFrontendCategoryId();

        // Map job data
        const jobType = mapWorkType(jobData.taxonomy?.work_type);
        const remoteType = mapRemoteType(jobData.remote);
        const experienceLevel = mapExperienceLevel(jobData.taxonomy?.level);
        const location = formatLocation(jobData.locations);

        // Create job
        const [newJob] = await db
          .insert(jobs)
          .values({
            title: jobData.title,
            companyName: jobData.company?.name || "Unknown Company",
            companyLogo: jobData.company?.avatar || null,
            type: jobType,
            remoteType,
            location,
            description: jobData.description,
            applyMethod: jobData.apply_url || sourceUrl,
            source: "VUEJOBS",
            sourceUrl,
            status: "PUBLISHED",
            publishedAt: new Date(jobData.published_at || jobData.created_at),
            salaryMin: jobData.salary?.from || null,
            salaryMax: jobData.salary?.to || null,
            salaryCurrency: jobData.salary?.currency || "USD",
            categoryId,
            experienceLevel,
          })
          .returning();

        // Extract and add skills
        const detectedSkills = extractVueSkills(jobData.description, jobData.title);
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
        console.error("Error saving VueJobs job:", error);
        failCount++;
      }
    }

    console.log(`VueJobs crawl completed: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: recentJobs.length,
    };
  } catch (error) {
    console.error("Error crawling VueJobs:", error);
    throw error;
  }
}
