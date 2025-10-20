import { NextRequest, NextResponse } from "next/server";

import { desc, eq, and, or, sql, like, gte, lte } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const keyword = searchParams.get("keyword") || searchParams.get("q") || "";
    const type = searchParams.get("type");
    const remoteType = searchParams.get("remoteType");
    const source = searchParams.get("source");
    const salaryMin = searchParams.get("salaryMin");
    const salaryMax = searchParams.get("salaryMax");
    const publishedDate = searchParams.get("publishedDate");
    const sort = searchParams.get("sort") || "latest";

    // Build where conditions
    const conditions = [eq(jobs.status, "PUBLISHED")];

    // Keyword search
    if (keyword) {
      conditions.push(
        or(
          like(jobs.title, `%${keyword}%`),
          like(jobs.companyName, `%${keyword}%`),
          like(jobs.description, `%${keyword}%`)
        )!
      );
    }

    // Job type filter
    if (type) {
      conditions.push(eq(jobs.type, type as any));
    }

    // Remote type filter
    if (remoteType) {
      conditions.push(eq(jobs.remoteType, remoteType as any));
    }

    // Source filter
    if (source) {
      conditions.push(eq(jobs.source, source as any));
    }

    // Salary filter
    if (salaryMin) {
      conditions.push(gte(jobs.salaryMin, parseInt(salaryMin)));
    }
    if (salaryMax) {
      conditions.push(lte(jobs.salaryMax, parseInt(salaryMax)));
    }

    // Published date filter
    if (publishedDate) {
      const now = new Date();
      let dateThreshold: Date;

      switch (publishedDate) {
        case "today":
          dateThreshold = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          dateThreshold = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          dateThreshold = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateThreshold = new Date(0);
      }

      conditions.push(gte(jobs.publishedAt, dateThreshold));
    }

    // Build order by
    let orderBy;
    switch (sort) {
      case "salary":
        orderBy = [desc(jobs.salaryMax), desc(jobs.publishedAt)];
        break;
      case "popular":
        orderBy = [desc(jobs.views), desc(jobs.publishedAt)];
        break;
      default: // latest
        orderBy = [desc(jobs.publishedAt)];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch jobs
    const jobsList = await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(...conditions));

    // Fetch tags for each job
    const jobsWithTags = await Promise.all(
      jobsList.map(async (job) => {
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
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, { status: 500 });
  }
}
