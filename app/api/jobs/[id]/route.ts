import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Increment views
    await db
      .update(jobs)
      .set({ views: job.views + 1 })
      .where(eq(jobs.id, id));

    // Fetch tags
    const tags = await db
      .select({ tag: jobTags })
      .from(jobTagRelations)
      .innerJoin(jobTags, eq(jobTagRelations.tagId, jobTags.id))
      .where(eq(jobTagRelations.jobId, id));

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        views: job.views + 1,
        tags: tags.map((t) => t.tag),
      },
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch job" }, { status: 500 });
  }
}
