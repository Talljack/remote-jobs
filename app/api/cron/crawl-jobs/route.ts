import { NextRequest, NextResponse } from "next/server";

import { runCrawlers } from "@/lib/crawlers/scheduler";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting crawl job...");
    const results = await runCrawlers();

    return NextResponse.json({
      success: true,
      message: "Crawl job completed",
      results,
    });
  } catch (error: any) {
    console.error("Crawl job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Crawl job failed",
      },
      { status: 500 }
    );
  }
}
