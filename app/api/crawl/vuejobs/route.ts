import { NextResponse } from "next/server";

import { crawlVueJobs } from "@/lib/crawlers/vuejobs";

/**
 * API route to manually trigger VueJobs crawler
 * GET /api/crawl/vuejobs
 */
export async function GET() {
  try {
    console.log("Starting VueJobs crawler...");

    const result = await crawlVueJobs();

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
