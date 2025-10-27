import { NextRequest, NextResponse } from "next/server";

import { sql, and } from "drizzle-orm";

import { db, jobs } from "@/db";
import { buildJobConditions, parseJobFilters } from "@/lib/jobs/filter-utils";

/**
 * Get available job sources with counts
 * GET /api/jobs/sources
 */
export async function GET(request: NextRequest) {
  try {
    const filters = parseJobFilters(request.nextUrl.searchParams);
    const jobConditions = buildJobConditions(filters, { includeSource: false });
    const whereCondition =
      jobConditions.length > 1
        ? and(...jobConditions)
        : jobConditions.length === 1
          ? jobConditions[0]
          : undefined;

    let query = db
      .select({
        source: jobs.source,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs);

    if (whereCondition) {
      query = query.where(whereCondition) as typeof query;
    }

    const sources = await query.groupBy(jobs.source).orderBy(jobs.source);

    return NextResponse.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sources",
      },
      { status: 500 }
    );
  }
}
