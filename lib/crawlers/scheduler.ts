import { db, crawlLogs } from "@/db";

import { crawlV2EX } from "./v2ex";
// import { crawlEleduck } from "./eleduck"; // Will implement next

type CrawlResult = { success: number; failed: number; total: number };

export async function runCrawlers() {
  const results = {
    v2ex: { success: false, message: "", data: null as CrawlResult | null },
    eleduck: { success: false, message: "", data: null as CrawlResult | null },
  };

  // Crawl V2EX
  try {
    const startTime = Date.now();
    const v2exResult = await crawlV2EX();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "V2EX",
      status: v2exResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: v2exResult.total,
      successCount: v2exResult.success,
      failCount: v2exResult.failed,
      duration,
    });

    results.v2ex = {
      success: true,
      message: `V2EX: ${v2exResult.success} jobs crawled successfully`,
      data: v2exResult,
    };
  } catch (error) {
    console.error("V2EX crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "V2EX",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.v2ex = {
      success: false,
      message: `V2EX crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // TODO: Crawl Eleduck
  // try {
  //   const eleduckResult = await crawlEleduck();
  //   results.eleduck = { success: true, data: eleduckResult };
  // } catch (error) {
  //   results.eleduck = { success: false, data: null };
  // }

  return results;
}
