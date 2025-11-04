import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { db, jobs, auditLogs } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * DELETE /api/admin/jobs/[id]
 * Delete a job permanently
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, isAdmin, user } = await requireAdmin();

    if (!authorized) {
      return APIErrors.UNAUTHORIZED();
    }

    if (!isAdmin || !user) {
      return APIErrors.ADMIN_ONLY();
    }

    const { id } = await params;

    // Get job before deletion
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (!job) {
      return APIErrors.NOT_FOUND("Job");
    }

    // Delete job
    await db.delete(jobs).where(eq(jobs.id, id));

    // Log audit action
    await db.insert(auditLogs).values({
      adminId: user.id,
      action: "JOB_DELETE",
      targetType: "job",
      targetId: id,
      details: JSON.stringify({
        jobTitle: job.title,
        company: job.companyName,
        status: job.status,
        source: job.source,
      }),
      metadata: JSON.stringify(job), // Store full job data for recovery if needed
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return createAPISuccess({ id }, 200, "Job deleted successfully");
  } catch (error) {
    console.error("Error deleting job:", error);
    return createAPIError("Failed to delete job", 500);
  }
}
