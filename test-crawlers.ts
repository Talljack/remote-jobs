/**
 * Test script for new crawlers
 *
 * Usage:
 *   npx tsx test-crawlers.ts
 */

import { crawlHimalayas } from "./lib/crawlers/himalayas";
import { crawlRemotive } from "./lib/crawlers/remotive";
import { crawlRuanyfWeekly } from "./lib/crawlers/ruanyf-weekly";
import { crawlVueJobs } from "./lib/crawlers/vuejobs";

async function testCrawler(
  name: string,
  crawlerFn: () => Promise<{ success: number; failed: number; total: number }>
) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Testing ${name} Crawler`);
  console.log("=".repeat(50));

  try {
    const startTime = Date.now();
    const result = await crawlerFn();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ ${name} crawl completed in ${duration}s`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Failed:  ${result.failed}`);
    console.log(`   Total:   ${result.total}`);

    if (result.success > 0) {
      console.log(`\n🎉 Successfully crawled ${result.success} jobs from ${name}!`);
    } else {
      console.log(`\n⚠️  No new jobs found (they may already exist in database)`);
    }

    return { success: true, result, duration };
  } catch (error) {
    console.error(`\n❌ ${name} crawler failed:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log("\n🚀 Starting Crawler Tests...\n");
  console.log("This will test the NEW crawlers without saving to database");
  console.log("(To actually save data, run the full scheduler)\n");

  const results = {
    himalayas: await testCrawler("Himalayas", crawlHimalayas),
    remotive: await testCrawler("Remotive", crawlRemotive),
    vuejobs: await testCrawler("VueJobs", crawlVueJobs),
    ruanyf: await testCrawler("Ruanyf Weekly", crawlRuanyfWeekly),
  };

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("TEST SUMMARY");
  console.log("=".repeat(50));

  const successful = Object.entries(results).filter(([, r]) => r.success);
  const failed = Object.entries(results).filter(([, r]) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/4`);
  successful.forEach(([name, result]) => {
    if (result.success && result.result) {
      console.log(`   ${name}: ${result.result.success} jobs in ${result.duration}s`);
    }
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/4`);
    failed.forEach(([name]) => {
      console.log(`   ${name}`);
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("Done! 🎉");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
