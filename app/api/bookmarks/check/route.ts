import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db, bookmarks } from "@/db";

/**
 * GET /api/bookmarks/check?jobId=xxx
 * Check if a job is bookmarked by the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    // If not logged in, return not bookmarked
    if (!userId) {
      return NextResponse.json({
        success: true,
        data: { isBookmarked: false },
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
    }

    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.jobId, jobId)))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        bookmarkId: bookmark?.id || null,
      },
    });
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check bookmark status" },
      { status: 500 }
    );
  }
}
