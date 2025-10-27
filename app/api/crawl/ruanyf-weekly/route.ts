import { NextResponse } from "next/server";

import { crawlRuanyfWeekly } from "@/lib/crawlers/ruanyf-weekly";

/**
 * API route to manually trigger Ruanyf Weekly crawler
 * GET /api/crawl/ruanyf-weekly
 */
export async function GET() {
  try {
    console.log("Starting Ruanyf Weekly crawler...");

    const result = await crawlRuanyfWeekly();

    return NextResponse.json({
      success: true,
      message: "Crawler completed",
      data: {
        success: result.success,
        failed: result.failed,
        total: result.total,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Crawler error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Crawler failed",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
