import { NextRequest } from "next/server";

import { and, desc, eq, or, sql } from "drizzle-orm";

import { db, jobs, users, JobStatus, JobSource } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * GET /api/admin/jobs
 * Get jobs list for admin review (with filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, isAdmin } = await requireAdmin();

    if (!authorized) {
      return APIErrors.UNAUTHORIZED();
    }

    if (!isAdmin) {
      return APIErrors.ADMIN_ONLY();
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const status = searchParams.get("status"); // DRAFT, PUBLISHED, CLOSED
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    // Build query conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(jobs.status, status as JobStatus));
    }
    if (source) {
      conditions.push(eq(jobs.source, source as JobSource));
    }
    if (search) {
      conditions.push(
        or(
          sql`${jobs.title} ILIKE ${`%${search}%`}`,
          sql`${jobs.companyName} ILIKE ${`%${search}%`}`
        )!
      );
    }

    // Get jobs
    const jobsList = await db
      .select({
        job: jobs,
        publisher: users,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.publisherId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count(jobs) })
      .from(jobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return createAPISuccess({
      jobs: jobsList.map(({ job, publisher }) => ({
        ...job,
        publisher: publisher
          ? {
              id: publisher.id,
              name: publisher.name,
              email: publisher.email,
              avatar: publisher.avatar,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs for admin:", error);
    return createAPIError("Failed to fetch jobs", 500);
  }
}
