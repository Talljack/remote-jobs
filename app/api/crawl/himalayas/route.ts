import { NextResponse } from "next/server";

import { crawlHimalayas } from "@/lib/crawlers/himalayas";

/**
 * API route to manually trigger Himalayas crawler
 * GET /api/crawl/himalayas
 */
export async function GET() {
  try {
    console.log("Starting Himalayas crawler...");

    const result = await crawlHimalayas();

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
