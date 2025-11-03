import { and, eq, lte, sql } from "drizzle-orm";

import {
  db,
  jobs,
  jobSubscriptions,
  jobTagRelations,
  notificationQueue,
  subscriptionTagRelations,
  users,
  type Job,
  type JobSubscription,
} from "@/db";

/**
 * Check if a job matches a subscription's filter criteria
 */
function isJobMatchingSubscription(job: Job, subscription: JobSubscription): boolean {
  // Check job types
  if (subscription.jobTypes && subscription.jobTypes.length > 0) {
    if (!subscription.jobTypes.includes(job.type)) {
      return false;
    }
  }

  // Check remote types
  if (subscription.remoteTypes && subscription.remoteTypes.length > 0) {
    if (!subscription.remoteTypes.includes(job.remoteType)) {
      return false;
    }
  }

  // Check sources
  if (subscription.sources && subscription.sources.length > 0) {
    if (!subscription.sources.includes(job.source)) {
      return false;
    }
  }

  // Check salary minimum
  if (subscription.salaryMin && job.salaryMin) {
    if (job.salaryMin < subscription.salaryMin) {
      return false;
    }
  }

  // Check category
  if (subscription.categoryId && job.categoryId) {
    if (subscription.categoryId !== job.categoryId) {
      return false;
    }
  }

  // Check experience level
  if (subscription.experienceLevel && job.experienceLevel) {
    if (subscription.experienceLevel !== job.experienceLevel) {
      return false;
    }
  }

  // Check keywords
  if (subscription.keywords && subscription.keywords.length > 0) {
    const jobText = `${job.title} ${job.description} ${job.companyName}`.toLowerCase();
    const hasMatchingKeyword = subscription.keywords.some((keyword) =>
      jobText.includes(keyword.toLowerCase())
    );

    if (!hasMatchingKeyword) {
      return false;
    }
  }

  return true;
}

/**
 * Check if subscription tags match job tags
 */
async function checkTagsMatch(subscriptionId: string, jobId: string): Promise<boolean> {
  // Get subscription tags
  const subscriptionTags = await db
    .select({ tagId: subscriptionTagRelations.tagId })
    .from(subscriptionTagRelations)
    .where(eq(subscriptionTagRelations.subscriptionId, subscriptionId));

  if (subscriptionTags.length === 0) {
    // No tags to match, consider it as matching
    return true;
  }

  // Get job tags
  const jobTagIds = await db
    .select({ tagId: jobTagRelations.tagId })
    .from(jobTagRelations)
    .where(eq(jobTagRelations.jobId, jobId));

  const jobTagIdSet = new Set(jobTagIds.map((t) => t.tagId));

  // Check if at least one subscription tag matches job tags
  return subscriptionTags.some((st) => jobTagIdSet.has(st.tagId));
}

/**
 * Match new jobs against active subscriptions and create notifications
 * @param jobIds - Array of job IDs to match (usually newly created jobs)
 * @returns Number of notifications created
 */
export async function matchJobsToSubscriptions(jobIds: string[]): Promise<number> {
  if (jobIds.length === 0) {
    return 0;
  }

  let notificationsCreated = 0;

  try {
    // Get all active subscriptions with user email notification enabled
    const activeSubscriptions = await db
      .select({
        subscription: jobSubscriptions,
        user: users,
      })
      .from(jobSubscriptions)
      .innerJoin(users, eq(jobSubscriptions.userId, users.id))
      .where(
        and(
          eq(jobSubscriptions.isActive, true),
          eq(users.emailNotification, true),
          eq(users.isBanned, false)
        )
      );

    // Get jobs
    const jobsList = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.id} = ANY(${jobIds})`);

    // For each subscription, check which jobs match
    for (const { subscription, user } of activeSubscriptions) {
      const matchingJobs: Job[] = [];

      for (const job of jobsList) {
        // Basic criteria match
        const criteriaMatch = isJobMatchingSubscription(job, subscription);

        if (criteriaMatch) {
          // Check tags match
          const tagsMatch = await checkTagsMatch(subscription.id, job.id);

          if (tagsMatch) {
            matchingJobs.push(job);
          }
        }
      }

      // Create notifications for matching jobs
      if (matchingJobs.length > 0) {
        const now = new Date();
        let scheduledFor = now;

        // Determine when to send based on frequency
        if (subscription.frequency === "DAILY") {
          // Schedule for next day at 9 AM
          scheduledFor = new Date(now);
          scheduledFor.setHours(9, 0, 0, 0);
          if (scheduledFor <= now) {
            scheduledFor.setDate(scheduledFor.getDate() + 1);
          }
        } else if (subscription.frequency === "WEEKLY") {
          // Schedule for next Monday at 9 AM
          scheduledFor = new Date(now);
          scheduledFor.setHours(9, 0, 0, 0);
          const daysUntilMonday = (8 - scheduledFor.getDay()) % 7 || 7;
          scheduledFor.setDate(scheduledFor.getDate() + daysUntilMonday);
        }
        // IMMEDIATE: use current time

        // Insert notifications
        const notificationValues = matchingJobs.map((job) => ({
          userId: user.id,
          subscriptionId: subscription.id,
          jobId: job.id,
          status: "PENDING" as const,
          scheduledFor,
        }));

        await db.insert(notificationQueue).values(notificationValues).onConflictDoNothing();

        notificationsCreated += notificationValues.length;
      }
    }

    console.log(`Created ${notificationsCreated} notifications for ${jobIds.length} jobs`);
  } catch (error) {
    console.error("Error matching jobs to subscriptions:", error);
  }

  return notificationsCreated;
}

/**
 * Get pending notifications ready to be sent
 */
export async function getPendingNotifications(limit: number = 100) {
  const now = new Date();

  return await db
    .select({
      notification: notificationQueue,
      user: users,
      job: jobs,
      subscription: jobSubscriptions,
    })
    .from(notificationQueue)
    .innerJoin(users, eq(notificationQueue.userId, users.id))
    .innerJoin(jobs, eq(notificationQueue.jobId, jobs.id))
    .innerJoin(jobSubscriptions, eq(notificationQueue.subscriptionId, jobSubscriptions.id))
    .where(
      and(
        eq(notificationQueue.status, "PENDING"),
        lte(notificationQueue.scheduledFor, now),
        eq(users.emailNotification, true),
        eq(users.isBanned, false)
      )
    )
    .limit(limit);
}

/**
 * Mark notification as sent
 */
export async function markNotificationAsSent(notificationId: string) {
  return await db
    .update(notificationQueue)
    .set({
      status: "SENT",
      sentAt: new Date(),
    })
    .where(eq(notificationQueue.id, notificationId));
}

/**
 * Mark notification as failed
 */
export async function markNotificationAsFailed(notificationId: string, errorMessage: string) {
  return await db
    .update(notificationQueue)
    .set({
      status: "FAILED",
      errorMessage,
      retryCount: sql`${notificationQueue.retryCount} + 1`,
    })
    .where(eq(notificationQueue.id, notificationId));
}
