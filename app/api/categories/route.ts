import { NextResponse } from "next/server";

import { db, jobCategories } from "@/db";

/**
 * Get all job categories
 * GET /api/categories
 */
export async function GET() {
  try {
    const categories = await db.select().from(jobCategories).orderBy(jobCategories.name);

    return NextResponse.json({
      success: true,
      data: categories,
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
