import { NextResponse } from "next/server";

import { crawlWeWorkRemotely } from "@/lib/crawlers/weworkremotely";

/**
 * API route to manually trigger WeWorkRemotely crawler
 * GET /api/crawl/weworkremotely
 */
export async function GET() {
  try {
    console.log("Starting WeWorkRemotely crawler...");

    const result = await crawlWeWorkRemotely();

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
