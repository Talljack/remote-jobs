import { NextResponse } from "next/server";

import { crawlRemotive } from "@/lib/crawlers/remotive";

/**
 * API route to manually trigger Remotive crawler
 * GET /api/crawl/remotive
 */
export async function GET() {
  try {
    console.log("Starting Remotive crawler...");

    const result = await crawlRemotive();

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
