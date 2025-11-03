import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { db, jobs, auditLogs } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * PUT /api/admin/jobs/[id]/approve
 * Approve a job (set status to PUBLISHED)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, isAdmin, user } = await requireAdmin();

    if (!authorized) {
      return APIErrors.UNAUTHORIZED();
    }

    if (!isAdmin || !user) {
      return APIErrors.ADMIN_ONLY();
    }

    const { id } = await params;

    // Get job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (!job) {
      return APIErrors.NOT_FOUND("Job");
    }

    // Update job status to PUBLISHED
    const [updatedJob] = await db
      .update(jobs)
      .set({
        status: "PUBLISHED",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id))
      .returning();

    // Log audit action
    await db.insert(auditLogs).values({
      adminId: user.id,
      action: "JOB_APPROVE",
      targetType: "job",
      targetId: id,
      details: JSON.stringify({
        jobTitle: job.title,
        company: job.companyName,
        previousStatus: job.status,
        newStatus: "PUBLISHED",
      }),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return createAPISuccess(updatedJob, 200, "Job approved successfully");
  } catch (error) {
    console.error("Error approving job:", error);
    return createAPIError("Failed to approve job", 500);
  }
}
