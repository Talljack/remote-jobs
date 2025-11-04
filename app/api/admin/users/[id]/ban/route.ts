import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { db, users, auditLogs } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * PUT /api/admin/users/[id]/ban
 * Ban a user
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, isAdmin, user: adminUser } = await requireAdmin();

    if (!authorized) {
      return APIErrors.UNAUTHORIZED();
    }

    if (!isAdmin || !adminUser) {
      return APIErrors.ADMIN_ONLY();
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Get user
    const [targetUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!targetUser) {
      return APIErrors.NOT_FOUND("User");
    }

    // Cannot ban yourself
    if (targetUser.id === adminUser.id) {
      return createAPIError("Cannot ban yourself", 400);
    }

    // Cannot ban another admin
    if (targetUser.role === "ADMIN") {
      return createAPIError("Cannot ban admin users", 403);
    }

    // Ban user
    const [updatedUser] = await db
      .update(users)
      .set({
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason || "Violated platform policies",
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    // Log audit action
    await db.insert(auditLogs).values({
      adminId: adminUser.id,
      action: "USER_BAN",
      targetType: "user",
      targetId: id,
      details: JSON.stringify({
        userName: targetUser.name,
        userEmail: targetUser.email,
        reason: reason || "Violated platform policies",
      }),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return createAPISuccess(updatedUser, 200, "User banned successfully");
  } catch (error) {
    console.error("Error banning user:", error);
    return createAPIError("Failed to ban user", 500);
  }
}
