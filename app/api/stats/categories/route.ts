import { NextResponse } from "next/server";

import { and, count, eq, isNull } from "drizzle-orm";

import { db, jobs, jobCategories } from "@/db";

/**
 * GET /api/stats/categories
 * Get top job categories
 */
export async function GET() {
  try {
    // Get parent categories with job counts
    const categoriesData = await db
      .select({
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        count: count(jobs.id),
      })
      .from(jobCategories)
      .leftJoin(jobs, and(eq(jobs.categoryId, jobCategories.id), eq(jobs.status, "PUBLISHED")))
      .where(isNull(jobCategories.parentId))
      .groupBy(jobCategories.id, jobCategories.name, jobCategories.slug)
      .orderBy(count(jobs.id))
      .limit(10);

    const categories = categoriesData.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      count: Number(item.count),
    }));

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories statistics" },
      { status: 500 }
    );
  }
}
