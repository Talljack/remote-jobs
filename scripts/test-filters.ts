import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { db, jobs, jobCategories } from "@/db";
import { and, eq, inArray, sql } from "drizzle-orm";

async function testFilters() {
  console.log("🧪 Testing Filter Functionality\n");

  // Test 1: Get category distribution
  console.log("1️⃣ Testing Category Distribution:");
  const categoryStats = await db
    .select({
      id: jobCategories.id,
      name: jobCategories.name,
      slug: jobCategories.slug,
      parentId: jobCategories.parentId,
      count: sql<number>`count(${jobs.id})::int`,
    })
    .from(jobCategories)
    .leftJoin(jobs, sql`${jobs.categoryId} = ${jobCategories.id} AND ${jobs.status} = 'PUBLISHED'`)
    .where(sql`${jobCategories.parentId} IS NOT NULL`)
    .groupBy(jobCategories.id, jobCategories.name, jobCategories.slug, jobCategories.parentId)
    .having(sql`count(${jobs.id}) > 0`)
    .orderBy(sql`count(${jobs.id}) DESC`)
    .limit(10);

  console.log("  Top 10 categories with jobs:");
  categoryStats.forEach((cat) => {
    console.log(`    - ${cat.name}: ${cat.count} jobs`);
  });

  // Test 2: Test single category filter
  console.log("\n2️⃣ Testing Single Category Filter:");
  const reactCategory = categoryStats.find((c) => c.name === "React Developer");
  if (reactCategory) {
    const reactJobs = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.status, "PUBLISHED"), eq(jobs.categoryId, reactCategory.id)))
      .limit(3);

    console.log(`  Found ${reactJobs.length} React jobs (showing first 3):`);
    reactJobs.forEach((job) => {
      console.log(`    - ${job.title} at ${job.companyName}`);
    });
  }

  // Test 3: Test multiple category filter
  console.log("\n3️⃣ Testing Multiple Category Filter (React + Sales):");
  const salesCategory = categoryStats.find((c) => c.name === "Sales");
  if (reactCategory && salesCategory) {
    const multiCategoryJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "PUBLISHED"),
          inArray(jobs.categoryId, [reactCategory.id, salesCategory.id])
        )
      )
      .limit(5);

    console.log(`  Found ${multiCategoryJobs.length} jobs (React OR Sales):`);
    multiCategoryJobs.forEach((job) => {
      console.log(`    - ${job.title} at ${job.companyName}`);
    });
  }

  // Test 4: Test multiple filters (type + category)
  console.log("\n4️⃣ Testing Multiple Filters (FULL_TIME + React):");
  if (reactCategory) {
    const multiFilterJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "PUBLISHED"),
          eq(jobs.type, "FULL_TIME"),
          eq(jobs.categoryId, reactCategory.id)
        )
      )
      .limit(3);

    console.log(`  Found ${multiFilterJobs.length} FULL_TIME React jobs:`);
    multiFilterJobs.forEach((job) => {
      console.log(`    - ${job.title} at ${job.companyName}`);
    });
  }

  // Test 5: Test source filter with multiple values
  console.log("\n5️⃣ Testing Multiple Source Filter (REMOTEOK + HIMALAYAS):");
  const multiSourceJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "PUBLISHED"), inArray(jobs.source, ["REMOTEOK", "HIMALAYAS"])))
    .limit(5);

  console.log(`  Found ${multiSourceJobs.length} jobs from multiple sources:`);
  multiSourceJobs.forEach((job) => {
    console.log(`    - ${job.title} (${job.source})`);
  });

  // Test 6: Overall statistics
  console.log("\n6️⃣ Overall Statistics:");
  const [totalJobs] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.status, "PUBLISHED"));

  const [jobsWithCategory] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(and(eq(jobs.status, "PUBLISHED"), sql`${jobs.categoryId} IS NOT NULL`));

  const [jobsWithoutCategory] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(and(eq(jobs.status, "PUBLISHED"), sql`${jobs.categoryId} IS NULL`));

  console.log(`  Total published jobs: ${totalJobs.count}`);
  console.log(`  Jobs with category: ${jobsWithCategory.count}`);
  console.log(`  Jobs without category: ${jobsWithoutCategory.count}`);
  console.log(`  Coverage: ${((jobsWithCategory.count / totalJobs.count) * 100).toFixed(1)}%`);
}

testFilters()
  .then(() => {
    console.log("\n✅ All tests completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
