import { NextRequest, NextResponse } from "next/server";

import { cleanupOldData } from "@/lib/crawlers/cleaner";

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (optional: use CRON_SECRET or admin check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting manual cleanup...");
    const result = await cleanupOldData();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        deletedJobs: result.deletedJobs,
        deletedLogs: result.deletedLogs,
      },
    });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (optional: use CRON_SECRET or admin check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting manual cleanup via GET...");
    const result = await cleanupOldData();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        deletedJobs: result.deletedJobs,
        deletedLogs: result.deletedLogs,
      },
    });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 }
    );
  }
}
