import { NextRequest, NextResponse } from "next/server";

import { sql, isNull, and, eq } from "drizzle-orm";

import { db, jobs, jobCategories } from "@/db";
import { buildJobConditions, parseJobFilters } from "@/lib/jobs/filter-utils";

/**
 * Get available job categories with counts
 * GET /api/jobs/categories
 */
export async function GET(request: NextRequest) {
  try {
    const filters = parseJobFilters(request.nextUrl.searchParams);
    const jobConditions = buildJobConditions(filters, { includeCategory: false });
    const joinCondition =
      jobConditions.length > 0
        ? and(eq(jobs.categoryId, jobCategories.id), ...jobConditions)
        : eq(jobs.categoryId, jobCategories.id);

    // Get parent categories with child categories and job counts
    const parentCategories = await db
      .select({
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        icon: jobCategories.icon,
      })
      .from(jobCategories)
      .where(isNull(jobCategories.parentId))
      .orderBy(jobCategories.name);

    // Get all categories with job counts (only count PUBLISHED jobs)
    const categoriesWithCounts = await db
      .select({
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        icon: jobCategories.icon,
        parentId: jobCategories.parentId,
        count: sql<number>`count(${jobs.id})::int`,
      })
      .from(jobCategories)
      .leftJoin(jobs, joinCondition)
      .groupBy(
        jobCategories.id,
        jobCategories.name,
        jobCategories.slug,
        jobCategories.icon,
        jobCategories.parentId
      )
      .orderBy(jobCategories.name);

    // Build hierarchical structure
    const categoryTree = parentCategories.map((parent) => ({
      ...parent,
      count: categoriesWithCounts.find((c) => c.id === parent.id)?.count || 0,
      children: categoriesWithCounts
        .filter((c) => c.parentId === parent.id)
        .map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          icon: child.icon,
          count: child.count,
        })),
    }));

    return NextResponse.json({
      success: true,
      data: categoryTree,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}
