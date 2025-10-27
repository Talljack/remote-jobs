import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { db, jobs, jobTags, jobTagRelations } from "@/db";
import { buildJobConditions, parseJobFilters } from "@/lib/jobs/filter-utils";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "latest";

    // Build where conditions
    const filters = parseJobFilters(searchParams);
    const conditions = buildJobConditions(filters);

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
    const whereCondition =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    let jobsQuery = db.select().from(jobs);

    if (whereCondition) {
      jobsQuery = jobsQuery.where(whereCondition) as typeof jobsQuery;
    }

    const jobsList = await jobsQuery
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(jobs);

    if (whereCondition) {
      countQuery = countQuery.where(whereCondition) as typeof countQuery;
    }

    const [{ count }] = await countQuery;

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

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
      tags: tagNames = [],
      applyMethod,
      status = "PUBLISHED",
    } = body;

    // Validate required fields
    if (!title || !companyName || !type || !remoteType || !description || !applyMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create job
    const [newJob] = await db
      .insert(jobs)
      .values({
        publisherId: userId,
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
        source: "USER_POSTED",
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      })
      .returning();

    // Process tags
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tagSlug = slugify(tagName);

        // Check if tag exists
        let [tag] = await db.select().from(jobTags).where(eq(jobTags.slug, tagSlug)).limit(1);

        // Create tag if doesn't exist
        if (!tag) {
          [tag] = await db
            .insert(jobTags)
            .values({
              name: tagName,
              slug: tagSlug,
              count: 1,
            })
            .returning();
        } else {
          // Increment tag count
          await db
            .update(jobTags)
            .set({ count: tag.count + 1 })
            .where(eq(jobTags.id, tag.id));
        }

        // Create job-tag relation
        await db.insert(jobTagRelations).values({
          jobId: newJob.id,
          tagId: tag.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: newJob,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ success: false, error: "Failed to create job" }, { status: 500 });
  }
}
