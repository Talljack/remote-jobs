import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";

import { db, bookmarks, jobs, jobTags, jobTagRelations } from "@/db";

/**
 * GET /api/bookmarks
 * Get user's bookmarked jobs
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get user's bookmarks with job details
    const userBookmarks = await db
      .select({
        bookmark: bookmarks,
        job: jobs,
      })
      .from(bookmarks)
      .innerJoin(jobs, eq(bookmarks.jobId, jobs.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count(bookmarks) })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));

    // Fetch tags for each job
    const jobsWithTags = await Promise.all(
      userBookmarks.map(async ({ bookmark, job }) => {
        const tags = await db
          .select({ tag: jobTags })
          .from(jobTagRelations)
          .innerJoin(jobTags, eq(jobTagRelations.tagId, jobTags.id))
          .where(eq(jobTagRelations.jobId, job.id));

        return {
          bookmarkId: bookmark.id,
          bookmarkedAt: bookmark.createdAt,
          ...job,
          tags: tags.map((t) => t.tag),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        bookmarks: jobsWithTags,
        pagination: {
          page,
          limit,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Add a job to bookmarks
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
    }

    // Check if job exists
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Check if already bookmarked
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.jobId, jobId)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Job already bookmarked" },
        { status: 409 }
      );
    }

    // Create bookmark
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        userId,
        jobId,
      })
      .returning();

    // Increment bookmark count
    await db
      .update(jobs)
      .set({
        bookmarkCount: (job.bookmarkCount || 0) + 1,
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
