import { NextResponse } from "next/server";

import { crawlWorkingNomads } from "@/lib/crawlers/workingnomads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    console.log("Starting Working Nomads crawl...");

    const result = await crawlWorkingNomads();

    return NextResponse.json({
      success: true,
      message: "Working Nomads crawl completed",
      total: result.total,
      successCount: result.success,
      failedCount: result.failed,
    });
  } catch (error) {
    console.error("Working Nomads crawl error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to crawl Working Nomads",
      },
      { status: 500 }
    );
  }
}
