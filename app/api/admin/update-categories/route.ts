import { NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, isNull, and } from "drizzle-orm";

import { db, jobs, jobCategories } from "@/db";

/**
 * Infer category from job title and description
 */
async function inferCategoryFromJob(title: string, description: string): Promise<string | null> {
  const text = `${title} ${description}`.toLowerCase();

  // Category mapping with keywords (ordered by priority)
  const categoryMap: [string, string[]][] = [
    // Specific frontend frameworks first
    ["engineering.frontend.react", ["react", "reactjs", "react.js", "next.js", "nextjs"]],
    ["engineering.frontend.vue", ["vue", "vuejs", "vue.js", "nuxt"]],
    ["engineering.frontend.angular", ["angular", "angularjs"]],

    // Specific backend languages
    ["engineering.backend.python", ["python", "django", "flask", "fastapi"]],
    ["engineering.backend.nodejs", ["node.js", "nodejs", "express.js"]],
    ["engineering.backend.java", ["java developer", "spring boot", "kotlin"]],
    ["engineering.backend.go", ["golang", "go developer", "go engineer"]],

    // Mobile
    ["engineering.mobile", ["mobile", "ios", "android", "flutter", "react native", "swift"]],

    // Full Stack
    ["engineering.fullstack", ["full stack", "fullstack", "full-stack"]],

    // Frontend general
    [
      "engineering.frontend",
      ["frontend", "front-end", "front end", "web developer", "javascript", "typescript"],
    ],

    // Backend general
    ["engineering.backend", ["backend", "back-end", "back end", "server", "api"]],

    // DevOps
    [
      "engineering.devops",
      ["devops", "sre", "site reliability", "kubernetes", "docker", "aws", "cloud"],
    ],

    // QA
    ["engineering.qa", ["qa engineer", "quality assurance", "test engineer", "testing"]],

    // Security
    ["engineering.security", ["security engineer", "cybersecurity", "infosec"]],

    // Data
    ["data.science", ["data scientist", "data science"]],
    ["data.engineer", ["data engineer", "data engineering", "etl"]],
    ["data.analyst", ["data analyst", "business analyst", "analytics"]],

    // AI/ML
    ["ml.ai.engineer", ["ai engineer", "ml engineer", "machine learning engineer"]],
    ["ml.ai.llm", ["llm", "large language model", "gpt", "chatbot"]],
    ["ml.ai", ["machine learning", "artificial intelligence"]],

    // Product & Design
    ["product.manager", ["product manager", "product owner", "product lead"]],
    ["product.designer", ["product designer", "visual designer"]],
    ["ux.designer", ["ux designer", "ux/ui", "user experience"]],
    ["ui.designer", ["ui designer", "ui/ux", "user interface"]],

    // Business - Sales
    ["business.sales", ["sales", "account executive", "sales development", "business development"]],

    // Business - Marketing
    ["business.marketing", ["marketing", "growth", "content marketing", "digital marketing"]],

    // Business - Operations
    ["business.operations", ["operations", "ops manager", "business operations"]],

    // Business - Customer Success
    ["business.customer_success", ["customer success", "account manager"]],

    // Business - Customer Support
    ["business.customer_support", ["customer support", "support engineer", "technical support"]],

    // Other
    ["other.content", ["content writer", "copywriter", "technical writer"]],
    ["other.hr", ["recruiter", "talent acquisition", "human resources"]],
    ["other.finance", ["finance", "accountant", "financial"]],
    ["other.legal", ["legal", "lawyer", "attorney", "counsel"]],
  ];

  // Find matching category (first match wins)
  for (const [categorySlug, keywords] of categoryMap) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        const [category] = await db
          .select()
          .from(jobCategories)
          .where(eq(jobCategories.slug, categorySlug))
          .limit(1);

        if (category) return category.id;
      }
    }
  }

  return null;
}

/**
 * Update categories for jobs without categoryId
 * POST /api/admin/update-categories
 *
 * Requires: Admin authentication
 */
export async function POST() {
  try {
    // Verify authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    // Verify admin role
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string | undefined;

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    console.log("🔍 Finding jobs without categoryId...");

    // Get jobs without category
    const jobsWithoutCategory = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        source: jobs.source,
      })
      .from(jobs)
      .where(and(eq(jobs.status, "PUBLISHED"), isNull(jobs.categoryId)))
      .limit(500); // Process in batches to avoid timeout

    console.log(`Found ${jobsWithoutCategory.length} jobs without category`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const job of jobsWithoutCategory) {
      try {
        const categoryId = await inferCategoryFromJob(job.title, job.description);

        if (categoryId) {
          await db.update(jobs).set({ categoryId }).where(eq(jobs.id, job.id));
          updatedCount++;

          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} jobs...`);
          }
        } else {
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error);
      }
    }

    console.log("\n=== Update Summary ===");
    console.log(`✅ Successfully updated: ${updatedCount} jobs`);
    console.log(`⚠️  No category found: ${notFoundCount} jobs`);

    return NextResponse.json({
      success: true,
      data: {
        updated: updatedCount,
        notFound: notFoundCount,
        total: jobsWithoutCategory.length,
      },
    });
  } catch (error) {
    console.error("Error updating categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update categories" },
      { status: 500 }
    );
  }
}
