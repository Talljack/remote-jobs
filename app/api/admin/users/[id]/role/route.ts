import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { db, users, auditLogs } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * PUT /api/admin/users/[id]/role
 * Change user role
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
    const { role } = body;

    if (!role || (role !== "USER" && role !== "ADMIN")) {
      return createAPIError("Invalid role. Must be USER or ADMIN", 400);
    }

    // Get user
    const [targetUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!targetUser) {
      return APIErrors.NOT_FOUND("User");
    }

    // Cannot change own role
    if (targetUser.id === adminUser.id) {
      return createAPIError("Cannot change your own role", 400);
    }

    // Update user role
    const [updatedUser] = await db
      .update(users)
      .set({
        role: role as "USER" | "ADMIN",
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    // Log audit action
    await db.insert(auditLogs).values({
      adminId: adminUser.id,
      action: "USER_ROLE_CHANGE",
      targetType: "user",
      targetId: id,
      details: JSON.stringify({
        userName: targetUser.name,
        userEmail: targetUser.email,
        previousRole: targetUser.role,
        newRole: role,
      }),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return createAPISuccess(updatedUser, 200, "User role updated successfully");
  } catch (error) {
    console.error("Error updating user role:", error);
    return createAPIError("Failed to update user role", 500);
  }
}
