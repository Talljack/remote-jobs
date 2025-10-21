import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      companyName,
      companyWebsite,
      type,
      remoteType,
      location,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description,
      requirements,
      applyMethod,
      status,
    } = body;

    // Validate required fields
    if (!title || !companyName || !type || !remoteType || !description || !applyMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if job exists and belongs to user
    const [existingJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, parseInt(id)))
      .limit(1);

    if (!existingJob) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (existingJob.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Update job
    const [updatedJob] = await db
      .update(jobs)
      .set({
        title,
        companyName,
        companyWebsite,
        type,
        remoteType,
        location,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: salaryCurrency || "USD",
        description,
        requirements,
        applyMethod,
        status,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if job exists and belongs to user
    const [existingJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, parseInt(id)))
      .limit(1);

    if (!existingJob) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (existingJob.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Delete job
    await db.delete(jobs).where(eq(jobs.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 });
  }
}
