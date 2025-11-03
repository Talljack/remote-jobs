import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { db, users, auditLogs } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * PUT /api/admin/users/[id]/unban
 * Unban a user
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

    // Get user
    const [targetUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!targetUser) {
      return APIErrors.NOT_FOUND("User");
    }

    if (!targetUser.isBanned) {
      return createAPIError("User is not banned", 400);
    }

    // Unban user
    const [updatedUser] = await db
      .update(users)
      .set({
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    // Log audit action
    await db.insert(auditLogs).values({
      adminId: adminUser.id,
      action: "USER_UNBAN",
      targetType: "user",
      targetId: id,
      details: JSON.stringify({
        userName: targetUser.name,
        userEmail: targetUser.email,
      }),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return createAPISuccess(updatedUser, 200, "User unbanned successfully");
  } catch (error) {
    console.error("Error unbanning user:", error);
    return createAPIError("Failed to unban user", 500);
  }
}
