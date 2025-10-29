import { NextResponse } from "next/server";

import { count, countDistinct, eq, gte } from "drizzle-orm";

import { db, jobs } from "@/db";

/**
 * GET /api/stats/overview
 * Get platform overview statistics
 */
export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total jobs count
    const [{ totalJobs }] = await db.select({ totalJobs: count() }).from(jobs);

    // Active (published) jobs count
    const [{ activeJobs }] = await db
      .select({ activeJobs: count() })
      .from(jobs)
      .where(eq(jobs.status, "PUBLISHED"));

    // Unique companies count
    const [{ companies }] = await db
      .select({ companies: countDistinct(jobs.companyName) })
      .from(jobs)
      .where(eq(jobs.status, "PUBLISHED"));

    // Jobs added today
    const [{ newToday }] = await db
      .select({ newToday: count() })
      .from(jobs)
      .where(gte(jobs.createdAt, today));

    return NextResponse.json({
      success: true,
      data: {
        totalJobs: Number(totalJobs),
        activeJobs: Number(activeJobs),
        companies: Number(companies),
        newToday: Number(newToday),
      },
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch overview statistics" },
      { status: 500 }
    );
  }
}
