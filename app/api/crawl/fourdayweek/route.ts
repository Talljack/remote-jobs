import { NextResponse } from "next/server";

import { crawlFourDayWeek } from "@/lib/crawlers/fourdayweek";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    console.log("Starting 4 Day Week crawl...");

    const result = await crawlFourDayWeek();

    return NextResponse.json({
      success: true,
      message: "4 Day Week crawl completed",
      total: result.total,
      successCount: result.success,
      failedCount: result.failed,
    });
  } catch (error) {
    console.error("4 Day Week crawl error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to crawl 4 Day Week",
      },
      { status: 500 }
    );
  }
}
