import { NextRequest, NextResponse } from "next/server";

import { Job } from "@/db";
import { sendJobNotificationEmail } from "@/lib/subscriptions/email";
import {
  getPendingNotifications,
  markNotificationAsSent,
  markNotificationAsFailed,
} from "@/lib/subscriptions/matcher";

/**
 * POST /api/cron/send-notifications
 * Send pending job notifications (called by Vercel Cron or GitHub Actions)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting notification send job...");
    const startTime = Date.now();

    // Get pending notifications
    const notifications = await getPendingNotifications(100);

    if (notifications.length === 0) {
      console.log("[Cron] No pending notifications to send");
      return NextResponse.json({
        success: true,
        message: "No pending notifications",
        sent: 0,
        failed: 0,
      });
    }

    console.log(`[Cron] Found ${notifications.length} pending notifications`);

    // Group notifications by user and subscription
    const groupedNotifications = new Map<
      string,
      {
        user: { id: string; email: string; name: string | null };
        subscription: { id: string; name: string };
        jobs: Job[];
        notificationIds: string[];
      }
    >();

    for (const { notification, user, job, subscription } of notifications) {
      const key = `${user.id}-${subscription.id}`;

      if (!groupedNotifications.has(key)) {
        groupedNotifications.set(key, {
          user: { id: user.id, email: user.email, name: user.name },
          subscription: { id: subscription.id, name: subscription.name },
          jobs: [],
          notificationIds: [],
        });
      }

      const group = groupedNotifications.get(key)!;
      group.jobs.push(job);
      group.notificationIds.push(notification.id);
    }

    console.log(`[Cron] Grouped into ${groupedNotifications.size} email(s)`);

    let sent = 0;
    let failed = 0;

    // Send emails
    for (const group of groupedNotifications.values()) {
      try {
        const result = await sendJobNotificationEmail({
          userEmail: group.user.email,
          userName: group.user.name,
          subscriptionName: group.subscription.name,
          jobs: group.jobs.map((job) => ({
            id: job.id,
            title: job.title,
            companyName: job.companyName,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            remoteType: job.remoteType,
            type: job.type,
            location: job.location,
            publishedAt: job.publishedAt,
          })),
        });

        if (result.success) {
          // Mark all notifications in this group as sent
          for (const notificationId of group.notificationIds) {
            await markNotificationAsSent(notificationId);
          }
          sent += group.notificationIds.length;
          console.log(`[Cron] Sent ${group.jobs.length} jobs to ${group.user.email}`);
        } else {
          // Mark all notifications in this group as failed
          for (const notificationId of group.notificationIds) {
            await markNotificationAsFailed(notificationId, result.error || "Unknown error");
          }
          failed += group.notificationIds.length;
          console.error(`[Cron] Failed to send to ${group.user.email}: ${result.error}`);
        }
      } catch (error) {
        // Mark as failed
        for (const notificationId of group.notificationIds) {
          await markNotificationAsFailed(
            notificationId,
            error instanceof Error ? error.message : "Unknown error"
          );
        }
        failed += group.notificationIds.length;
        console.error(`[Cron] Error sending to ${group.user.email}:`, error);
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Cron] Notification send job completed in ${duration}ms: ${sent} sent, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      message: "Notification send job completed",
      sent,
      failed,
      duration,
    });
  } catch (error) {
    console.error("[Cron] Error in notification send job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  return POST(request);
}
