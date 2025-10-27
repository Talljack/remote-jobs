import "dotenv/config";
import { eq, isNull } from "drizzle-orm";

import { db, jobs, jobCategories } from "./db";

async function checkDatabaseData() {
  console.log("=== Checking Database Data ===\n");

  // Check total jobs
  const allJobs = await db.select().from(jobs);
  console.log(`Total jobs in database: ${allJobs.length}`);

  // Check published jobs
  const publishedJobs = await db.select().from(jobs).where(eq(jobs.status, "PUBLISHED"));
  console.log(`Published jobs: ${publishedJobs.length}\n`);

  // Check jobs with categoryId
  const jobsWithCategory = publishedJobs.filter((job) => job.categoryId !== null);
  console.log(`Published jobs with categoryId: ${jobsWithCategory.length}`);
  console.log(
    `Published jobs without categoryId: ${publishedJobs.length - jobsWithCategory.length}\n`
  );

  // Show sample jobs with categoryId
  if (jobsWithCategory.length > 0) {
    console.log("Sample jobs with categoryId:");
    jobsWithCategory.slice(0, 3).forEach((job) => {
      console.log(`- ${job.title} (${job.companyName}) - categoryId: ${job.categoryId}`);
    });
    console.log();
  }

  // Check categories
  const allCategories = await db.select().from(jobCategories);
  console.log(`Total categories: ${allCategories.length}`);

  const parentCategories = await db
    .select()
    .from(jobCategories)
    .where(isNull(jobCategories.parentId));
  console.log(`Parent categories: ${parentCategories.length}`);

  const childCategories = allCategories.filter((cat) => cat.parentId !== null);
  console.log(`Child categories: ${childCategories.length}\n`);

  // Check category counts
  console.log("Categories with job counts:");
  for (const cat of childCategories.slice(0, 10)) {
    const jobCount = publishedJobs.filter((job) => job.categoryId === cat.id).length;
    console.log(`- ${cat.name} (${cat.slug}): ${jobCount} jobs`);
  }
}

checkDatabaseData()
  .then(() => {
    console.log("\n✅ Check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
