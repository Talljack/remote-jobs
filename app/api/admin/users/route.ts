import { NextRequest } from "next/server";

import { and, desc, eq, or, sql } from "drizzle-orm";

import { db, users, UserRole } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * GET /api/admin/users
 * Get users list for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, isAdmin } = await requireAdmin();

    if (!authorized) {
      return APIErrors.UNAUTHORIZED();
    }

    if (!isAdmin) {
      return APIErrors.ADMIN_ONLY();
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const role = searchParams.get("role"); // USER or ADMIN
    const isBanned = searchParams.get("isBanned"); // "true" or "false"
    const search = searchParams.get("search");

    // Build query conditions
    const conditions = [];
    if (role) {
      conditions.push(eq(users.role, role as UserRole));
    }
    if (isBanned === "true") {
      conditions.push(eq(users.isBanned, true));
    } else if (isBanned === "false") {
      conditions.push(eq(users.isBanned, false));
    }
    if (search) {
      conditions.push(
        or(sql`${users.name} ILIKE ${`%${search}%`}`, sql`${users.email} ILIKE ${`%${search}%`}`)!
      );
    }

    // Get users
    const usersList = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count(users) })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return createAPISuccess({
      users: usersList,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    return createAPIError("Failed to fetch users", 500);
  }
}
