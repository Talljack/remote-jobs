import { NextResponse } from "next/server";

import { db, crawlLogs } from "@/db";
import { crawlBossZhipin } from "@/lib/crawlers/boss-zhipin";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for crawler

/**
 * Manual trigger for Boss Zhipin crawler
 * GET /api/crawl/boss-zhipin
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log("Starting Boss Zhipin crawl...");

    const result = await crawlBossZhipin();

    const duration = Date.now() - startTime;

    // Log crawl result
    await db.insert(crawlLogs).values({
      source: "BOSS_ZHIPIN",
      status: result.failed === 0 ? "SUCCESS" : result.success > 0 ? "PARTIAL" : "FAILED",
      totalCount: result.total,
      successCount: result.success,
      failCount: result.failed,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: `Boss Zhipin crawl completed: ${result.success} jobs added, ${result.failed} failed`,
      data: {
        ...result,
        duration,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    await db.insert(crawlLogs).values({
      source: "BOSS_ZHIPIN",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      duration,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Boss Zhipin crawl error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to crawl Boss Zhipin",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
