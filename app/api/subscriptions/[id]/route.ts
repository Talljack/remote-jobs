import { NextRequest } from "next/server";

import { and, eq } from "drizzle-orm";

import { db, jobSubscriptions, jobTags, subscriptionTagRelations } from "@/db";
import { requireAuth } from "@/lib/api/auth";
import { createAPIError, createAPISuccess, APIErrors } from "@/lib/api/errors";

/**
 * GET /api/subscriptions/[id]
 * Get a single subscription
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, userId } = await requireAuth();

    if (!authorized || !userId) {
      return APIErrors.UNAUTHORIZED();
    }

    const { id } = await params;

    // Get subscription
    const [subscription] = await db
      .select()
      .from(jobSubscriptions)
      .where(and(eq(jobSubscriptions.id, id), eq(jobSubscriptions.userId, userId)))
      .limit(1);

    if (!subscription) {
      return APIErrors.NOT_FOUND("Subscription");
    }

    // Get tags
    const tags = await db
      .select({ tag: jobTags })
      .from(subscriptionTagRelations)
      .innerJoin(jobTags, eq(subscriptionTagRelations.tagId, jobTags.id))
      .where(eq(subscriptionTagRelations.subscriptionId, subscription.id));

    return createAPISuccess({
      ...subscription,
      tags: tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return createAPIError("Failed to fetch subscription", 500);
  }
}

/**
 * PUT /api/subscriptions/[id]
 * Update a subscription
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, userId } = await requireAuth();

    if (!authorized || !userId) {
      return APIErrors.UNAUTHORIZED();
    }

    const { id } = await params;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(jobSubscriptions)
      .where(and(eq(jobSubscriptions.id, id), eq(jobSubscriptions.userId, userId)))
      .limit(1);

    if (!existing) {
      return APIErrors.NOT_FOUND("Subscription");
    }

    const body = await request.json();
    const {
      name,
      isActive,
      frequency,
      keywords,
      jobTypes,
      remoteTypes,
      sources,
      salaryMin,
      categoryId,
      experienceLevel,
      tagIds,
    } = body;

    // Update subscription
    const [subscription] = await db
      .update(jobSubscriptions)
      .set({
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(frequency !== undefined && { frequency }),
        ...(keywords !== undefined && { keywords }),
        ...(jobTypes !== undefined && { jobTypes }),
        ...(remoteTypes !== undefined && { remoteTypes }),
        ...(sources !== undefined && { sources }),
        ...(salaryMin !== undefined && { salaryMin }),
        ...(categoryId !== undefined && { categoryId }),
        ...(experienceLevel !== undefined && { experienceLevel }),
        updatedAt: new Date(),
      })
      .where(eq(jobSubscriptions.id, id))
      .returning();

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tag relations
      await db
        .delete(subscriptionTagRelations)
        .where(eq(subscriptionTagRelations.subscriptionId, id));

      // Insert new tag relations
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        await db.insert(subscriptionTagRelations).values(
          tagIds.map((tagId: string) => ({
            subscriptionId: id,
            tagId,
          }))
        );
      }
    }

    return createAPISuccess(subscription, 200, "Subscription updated successfully");
  } catch (error) {
    console.error("Error updating subscription:", error);
    return createAPIError("Failed to update subscription", 500);
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Delete a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, userId } = await requireAuth();

    if (!authorized || !userId) {
      return APIErrors.UNAUTHORIZED();
    }

    const { id } = await params;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(jobSubscriptions)
      .where(and(eq(jobSubscriptions.id, id), eq(jobSubscriptions.userId, userId)))
      .limit(1);

    if (!existing) {
      return APIErrors.NOT_FOUND("Subscription");
    }

    // Delete subscription (cascade will handle related records)
    await db.delete(jobSubscriptions).where(eq(jobSubscriptions.id, id));

    return createAPISuccess({ id }, 200, "Subscription deleted successfully");
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return createAPIError("Failed to delete subscription", 500);
  }
}
