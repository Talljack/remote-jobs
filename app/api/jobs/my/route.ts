import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch user's jobs
    const userJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count() })
      .from(jobs)
      .where(eq(jobs.userId, userId));

    // Fetch tags for each job
    const jobsWithTags = await Promise.all(
      userJobs.map(async (job) => {
        const tags = await db
          .select({ tag: jobTags })
          .from(jobTagRelations)
          .innerJoin(jobTags, eq(jobTagRelations.tagId, jobTags.id))
          .where(eq(jobTagRelations.jobId, job.id));

        return {
          ...job,
          tags: tags.map((t) => t.tag),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithTags,
        pagination: {
          page,
          limit,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user jobs" },
      { status: 500 }
    );
  }
}
