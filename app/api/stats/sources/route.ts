import { NextResponse } from "next/server";

import { count, eq } from "drizzle-orm";

import { db, jobs } from "@/db";

/**
 * GET /api/stats/sources
 * Get job distribution by source platform
 */
export async function GET() {
  try {
    const sourcesData = await db
      .select({
        source: jobs.source,
        count: count(),
      })
      .from(jobs)
      .where(eq(jobs.status, "PUBLISHED"))
      .groupBy(jobs.source)
      .orderBy(count());

    const sources = sourcesData.map((item) => ({
      source: item.source,
      count: Number(item.count),
    }));

    return NextResponse.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    console.error("Error fetching sources stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sources statistics" },
      { status: 500 }
    );
  }
}
