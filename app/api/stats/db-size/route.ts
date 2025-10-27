import { NextResponse } from "next/server";

import { sql } from "drizzle-orm";

import { db } from "@/db";

/**
 * Get database size statistics
 * GET /api/stats/db-size
 */
export async function GET() {
  try {
    // Count records in each table
    const [jobsCount] = await db.execute(sql`SELECT COUNT(*) as count FROM jobs`);
    const [tagsCount] = await db.execute(sql`SELECT COUNT(*) as count FROM job_tags`);
    const [tagRelationsCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM job_tag_relations`
    );
    const [skillsCount] = await db.execute(sql`SELECT COUNT(*) as count FROM skills`);
    const [skillRelationsCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM job_skill_relations`
    );
    const [categoriesCount] = await db.execute(sql`SELECT COUNT(*) as count FROM job_categories`);

    // Get table sizes
    const tableSizes = await db.execute(sql`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size,
        pg_total_relation_size('public.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.'||tablename) DESC
    `);

    // Get total database size
    const [dbSize] = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as total_size
    `);

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          jobs: Number(jobsCount.rows[0].count),
          tags: Number(tagsCount.rows[0].count),
          tagRelations: Number(tagRelationsCount.rows[0].count),
          skills: Number(skillsCount.rows[0].count),
          skillRelations: Number(skillRelationsCount.rows[0].count),
          categories: Number(categoriesCount.rows[0].count),
        },
        tableSizes: tableSizes.rows,
        totalSize: dbSize.rows[0].total_size,
      },
    });
  } catch (error) {
    console.error("Error fetching database stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch database stats",
      },
      { status: 500 }
    );
  }
}
