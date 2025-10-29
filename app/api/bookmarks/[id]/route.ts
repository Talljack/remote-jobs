import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db, bookmarks, jobs } from "@/db";

/**
 * DELETE /api/bookmarks/[id]
 * Remove a bookmark
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find bookmark and verify ownership
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .limit(1);

    if (!bookmark) {
      return NextResponse.json({ success: false, error: "Bookmark not found" }, { status: 404 });
    }

    // Delete bookmark
    await db.delete(bookmarks).where(eq(bookmarks.id, id));

    // Decrement bookmark count
    const [job] = await db.select().from(jobs).where(eq(jobs.id, bookmark.jobId)).limit(1);

    if (job) {
      await db
        .update(jobs)
        .set({
          bookmarkCount: Math.max((job.bookmarkCount || 0) - 1, 0),
        })
        .where(eq(jobs.id, bookmark.jobId));
    }

    return NextResponse.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
