import { NextResponse } from "next/server";

import { gte, sql } from "drizzle-orm";

import { db, jobs } from "@/db";

/**
 * GET /api/stats/trends
 * Get job posting trends for the last 30 days
 */
export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily job counts for the last 30 days
    const trendsData = await db
      .select({
        date: sql<string>`DATE(${jobs.createdAt})`.as("date"),
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(jobs)
      .where(gte(jobs.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${jobs.createdAt})`)
      .orderBy(sql`DATE(${jobs.createdAt})`);

    const trends = trendsData.map((item) => ({
      date: item.date,
      count: Number(item.count),
    }));

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("Error fetching trends stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trends statistics" },
      { status: 500 }
    );
  }
}
