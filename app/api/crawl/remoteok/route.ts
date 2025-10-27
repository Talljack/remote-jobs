import { NextResponse } from "next/server";

import { crawlRemoteOK } from "@/lib/crawlers/remoteok";

/**
 * API route to manually trigger RemoteOK crawler
 * GET /api/crawl/remoteok
 */
export async function GET() {
  try {
    console.log("Starting RemoteOK crawler...");

    const result = await crawlRemoteOK();

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
