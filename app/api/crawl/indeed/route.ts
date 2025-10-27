import { NextResponse } from "next/server";

import { db, crawlLogs } from "@/db";
import { crawlIndeed } from "@/lib/crawlers/indeed";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for crawler

/**
 * Manual trigger for Indeed crawler
 * GET /api/crawl/indeed
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log("Starting Indeed crawl...");

    const result = await crawlIndeed();

    const duration = Date.now() - startTime;

    // Log crawl result
    await db.insert(crawlLogs).values({
      source: "INDEED",
      status: result.failed === 0 ? "SUCCESS" : result.success > 0 ? "PARTIAL" : "FAILED",
      totalCount: result.total,
      successCount: result.success,
      failCount: result.failed,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: `Indeed crawl completed: ${result.success} jobs added, ${result.failed} failed`,
      data: {
        ...result,
        duration,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    await db.insert(crawlLogs).values({
      source: "INDEED",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      duration,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Indeed crawl error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to crawl Indeed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
