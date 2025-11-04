import { NextRequest } from "next/server";

import { desc, eq } from "drizzle-orm";

import { db, jobSubscriptions, jobTags, subscriptionTagRelations } from "@/db";
import { requireAuth } from "@/lib/api/auth";
import { createAPIError, createAPISuccess } from "@/lib/api/errors";

/**
 * GET /api/subscriptions
 * Get user's job subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, userId } = await requireAuth();

    if (!authorized || !userId) {
      return createAPIError("Unauthorized", 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get user's subscriptions
    const userSubscriptions = await db
      .select()
      .from(jobSubscriptions)
      .where(eq(jobSubscriptions.userId, userId))
      .orderBy(desc(jobSubscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count(jobSubscriptions) })
      .from(jobSubscriptions)
      .where(eq(jobSubscriptions.userId, userId));

    // Fetch tags for each subscription
    const subscriptionsWithTags = await Promise.all(
      userSubscriptions.map(async (subscription) => {
        const tags = await db
          .select({ tag: jobTags })
          .from(subscriptionTagRelations)
          .innerJoin(jobTags, eq(subscriptionTagRelations.tagId, jobTags.id))
          .where(eq(subscriptionTagRelations.subscriptionId, subscription.id));

        return {
          ...subscription,
          tags: tags.map((t) => t.tag),
        };
      })
    );

    return createAPISuccess({
      subscriptions: subscriptionsWithTags,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return createAPIError("Failed to fetch subscriptions", 500);
  }
}

/**
 * POST /api/subscriptions
 * Create a new job subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, userId } = await requireAuth();

    if (!authorized || !userId) {
      return createAPIError("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      name,
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

    // Validate required fields
    if (!name) {
      return createAPIError("Subscription name is required", 400);
    }

    // Create subscription
    const [subscription] = await db
      .insert(jobSubscriptions)
      .values({
        userId,
        name,
        frequency: frequency || "DAILY",
        keywords: keywords || null,
        jobTypes: jobTypes || null,
        remoteTypes: remoteTypes || null,
        sources: sources || null,
        salaryMin: salaryMin || null,
        categoryId: categoryId || null,
        experienceLevel: experienceLevel || null,
      })
      .returning();

    // Link tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(subscriptionTagRelations).values(
        tagIds.map((tagId: string) => ({
          subscriptionId: subscription.id,
          tagId,
        }))
      );
    }

    return createAPISuccess(subscription, 201, "Subscription created successfully");
  } catch (error) {
    console.error("Error creating subscription:", error);
    return createAPIError("Failed to create subscription", 500);
  }
}
