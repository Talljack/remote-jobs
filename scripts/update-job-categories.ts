import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db, jobs, jobCategories } from "@/db";
import { eq, isNull, and } from "drizzle-orm";

/**
 * Infer category from job title and description
 */
async function inferCategoryFromJob(title: string, description: string): Promise<string | null> {
  const text = `${title} ${description}`.toLowerCase();

  // Category mapping with keywords
  const categoryMap: Record<string, string[]> = {
    // Engineering - Frontend
    "engineering.frontend": [
      "frontend",
      "front-end",
      "front end",
      "react",
      "vue",
      "angular",
      "javascript",
      "typescript",
      "css",
      "html",
      "web developer",
    ],
    "engineering.frontend.react": ["react", "reactjs", "react.js", "next.js", "nextjs"],
    "engineering.frontend.vue": ["vue", "vuejs", "vue.js", "nuxt"],
    "engineering.frontend.angular": ["angular", "angularjs"],

    // Engineering - Backend
    "engineering.backend": ["backend", "back-end", "back end", "server", "api", "microservice"],
    "engineering.backend.python": ["python", "django", "flask", "fastapi"],
    "engineering.backend.nodejs": ["node", "nodejs", "node.js", "express"],
    "engineering.backend.java": ["java", "spring", "kotlin"],
    "engineering.backend.go": ["golang", "go developer", " go "],

    // Engineering - Full Stack
    "engineering.fullstack": ["full stack", "fullstack", "full-stack", "full stack developer"],

    // Engineering - Mobile
    "engineering.mobile": [
      "mobile",
      "ios",
      "android",
      "flutter",
      "react native",
      "swift",
      "kotlin",
    ],

    // Engineering - DevOps
    "engineering.devops": [
      "devops",
      "sre",
      "site reliability",
      "infrastructure",
      "kubernetes",
      "docker",
      "aws",
      "cloud engineer",
    ],

    // Engineering - QA
    "engineering.qa": ["qa", "quality assurance", "test engineer", "automation", "testing"],

    // Engineering - Security
    "engineering.security": [
      "security",
      "cybersecurity",
      "infosec",
      "penetration",
      "security engineer",
    ],

    // Data
    "data.science": ["data scientist", "data science"],
    "data.engineer": ["data engineer", "data engineering", "etl"],
    "data.analyst": ["data analyst", "business analyst", "analytics"],

    // AI/ML
    "ml.ai": ["machine learning", "ml engineer", "artificial intelligence"],
    "ml.ai.engineer": ["ai engineer", "ml engineer"],
    "ml.ai.llm": ["llm", "large language model", "gpt", "chatbot"],

    // Product & Design
    "product.manager": ["product manager", "product owner", "pm ", " pm,", "product lead"],
    "product.designer": ["product designer", "designer", "design", "visual designer"],
    "ux.designer": ["ux designer", "ux/ui", "user experience"],
    "ui.designer": ["ui designer", "ui/ux", "user interface"],

    // Business - Sales
    "business.sales": [
      "sales",
      "account executive",
      "sales development",
      "sdr",
      "business development",
      "bdr",
    ],

    // Business - Marketing
    "business.marketing": [
      "marketing",
      "growth",
      "content marketing",
      "digital marketing",
      "seo",
      "sem",
    ],

    // Business - Operations
    "business.operations": ["operations", "ops manager", "business operations"],

    // Business - Customer Success
    "business.customer_success": [
      "customer success",
      "csm",
      "customer success manager",
      "account manager",
    ],

    // Business - Customer Support
    "business.customer_support": [
      "customer support",
      "support engineer",
      "technical support",
      "help desk",
    ],

    // Other
    "other.content": ["content writer", "copywriter", "technical writer", "writer"],
    "other.hr": ["hr", "human resources", "recruiter", "talent"],
    "other.finance": ["finance", "accountant", "financial"],
    "other.legal": ["legal", "lawyer", "attorney", "counsel"],
  };

  // Find matching category
  for (const [categorySlug, keywords] of Object.entries(categoryMap)) {
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
 */
async function updateJobCategories() {
  console.log("🔍 Finding jobs without categoryId...\n");

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
    .limit(1000); // Process in batches

  console.log(`Found ${jobsWithoutCategory.length} jobs without category\n`);

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
  console.log(`📊 Total processed: ${jobsWithoutCategory.length} jobs\n`);

  // Show updated category distribution
  console.log("📈 Category distribution after update:");
  const categoryStats = await db.execute<{
    name: string;
    slug: string;
    count: string;
  }>(
    `
    SELECT c.name, c.slug, COUNT(j.id)::text as count
    FROM job_categories c
    LEFT JOIN jobs j ON j.category_id = c.id AND j.status = 'PUBLISHED'
    WHERE c.parent_id IS NOT NULL
    GROUP BY c.id, c.name, c.slug
    HAVING COUNT(j.id) > 0
    ORDER BY COUNT(j.id) DESC
    LIMIT 20
  `
  );

  categoryStats.rows.forEach((row) => {
    console.log(`  ${row.name}: ${row.count} jobs`);
  });
}

// Run the update
updateJobCategories()
  .then(() => {
    console.log("\n✅ Category update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
