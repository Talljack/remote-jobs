import { NextResponse } from "next/server";

import { crawlGreenhouse } from "@/lib/crawlers/greenhouse";

/**
 * API route to manually trigger Greenhouse crawler
 * GET /api/crawl/greenhouse
 */
export async function GET() {
  try {
    console.log("Starting Greenhouse crawler...");

    const result = await crawlGreenhouse();

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
