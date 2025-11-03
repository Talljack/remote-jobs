import { NextRequest } from "next/server";

import { and, desc, eq } from "drizzle-orm";

import { db, auditLogs, users, AuditAction } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * GET /api/admin/audit-logs
 * Get audit logs for admin review
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const action = searchParams.get("action"); // Audit action type
    const targetType = searchParams.get("targetType"); // "job", "user", "config"
    const adminId = searchParams.get("adminId"); // Filter by admin

    // Build query conditions
    const conditions = [];
    if (action) {
      conditions.push(eq(auditLogs.action, action as AuditAction));
    }
    if (targetType) {
      conditions.push(eq(auditLogs.targetType, targetType));
    }
    if (adminId) {
      conditions.push(eq(auditLogs.adminId, adminId));
    }

    // Get logs with admin info
    const logs = await db
      .select({
        log: auditLogs,
        admin: users,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.adminId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count(auditLogs) })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return createAPISuccess({
      logs: logs.map(({ log, admin }) => ({
        ...log,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          avatar: admin.avatar,
        },
      })),
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return createAPIError("Failed to fetch audit logs", 500);
  }
}
