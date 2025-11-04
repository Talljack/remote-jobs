import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db, users } from "@/db";

/**
 * Check if the current user is authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    return { authorized: false, userId: null, user: null };
  }

  return { authorized: true, userId, user: null };
}

/**
 * Check if the current user is an admin
 */
export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return { authorized: false, isAdmin: false, userId: null, user: null };
  }

  // Fetch user from database to check role
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.role !== "ADMIN") {
    return { authorized: true, isAdmin: false, userId, user };
  }

  // Check if user is banned
  if (user.isBanned) {
    return { authorized: true, isAdmin: false, userId, user, isBanned: true };
  }

  return { authorized: true, isAdmin: true, userId, user };
}

/**
 * Get current user info including role
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return user || null;
}
