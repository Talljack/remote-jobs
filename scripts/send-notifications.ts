/**
 * Send Job Notifications Script
 *
 * This script is designed to be run by GitHub Actions cron jobs.
 * It sends email notifications to users for jobs matching their subscriptions.
 *
 * Usage: npx tsx scripts/send-notifications.ts
 */

import {
  getPendingNotifications,
  markNotificationAsSent,
  markNotificationAsFailed,
} from "@/lib/subscriptions/matcher";
import { sendJobNotifications } from "@/lib/subscriptions/email";
import { db, jobs, jobSubscriptions, users } from "@/db";
import { inArray, eq } from "drizzle-orm";

async function main() {
  console.log("\n🔔 Starting notification send process...");
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Get all pending notifications
    const pendingNotifications = await getPendingNotifications();

    if (pendingNotifications.length === 0) {
      console.log("✅ No pending notifications to send\n");
      return;
    }

    console.log(`📬 Found ${pendingNotifications.length} pending notifications\n`);

    // Group notifications by user and subscription
    const groupedNotifications = new Map<string, Map<string, typeof pendingNotifications>>();

    for (const notification of pendingNotifications) {
      if (!groupedNotifications.has(notification.userId)) {
        groupedNotifications.set(notification.userId, new Map());
      }

      const userGroups = groupedNotifications.get(notification.userId)!;
      if (!userGroups.has(notification.subscriptionId)) {
        userGroups.set(notification.subscriptionId, []);
      }

      userGroups.get(notification.subscriptionId)!.push(notification);
    }

    console.log(`👥 Grouped into ${groupedNotifications.size} users\n`);

    let sentCount = 0;
    let failedCount = 0;

    // Process each user's notifications
    for (const [userId, subscriptionGroups] of groupedNotifications) {
      try {
        // Get user details
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
          console.log(`⚠️  User ${userId} not found, skipping...`);
          continue;
        }

        // Check if user has email notifications enabled
        if (!user.emailNotification) {
          console.log(`📧 User ${user.username} has email notifications disabled, skipping...`);

          // Mark all their notifications as failed with reason
          for (const notifications of subscriptionGroups.values()) {
            for (const notification of notifications) {
              await markNotificationAsFailed(
                notification.id,
                "User has email notifications disabled"
              );
            }
          }
          continue;
        }

        // Check if user is banned
        if (user.isBanned) {
          console.log(`🚫 User ${user.username} is banned, skipping...`);

          // Mark all their notifications as failed
          for (const notifications of subscriptionGroups.values()) {
            for (const notification of notifications) {
              await markNotificationAsFailed(notification.id, "User is banned");
            }
          }
          continue;
        }

        console.log(`\n📨 Processing notifications for user: ${user.username} (${user.email})`);

        // Process each subscription's notifications
        for (const [subscriptionId, notifications] of subscriptionGroups) {
          try {
            // Get subscription details
            const [subscription] = await db
              .select()
              .from(jobSubscriptions)
              .where(eq(jobSubscriptions.id, subscriptionId))
              .limit(1);

            if (!subscription) {
              console.log(`  ⚠️  Subscription ${subscriptionId} not found, skipping...`);
              continue;
            }

            if (!subscription.isActive) {
              console.log(`  📪 Subscription "${subscription.name}" is inactive, skipping...`);

              // Mark notifications as failed
              for (const notification of notifications) {
                await markNotificationAsFailed(notification.id, "Subscription is inactive");
              }
              continue;
            }

            // Get job details
            const jobIds = notifications.map((n) => n.jobId);
            const matchedJobs = await db.select().from(jobs).where(inArray(jobs.id, jobIds));

            if (matchedJobs.length === 0) {
              console.log(
                `  ⚠️  No jobs found for subscription "${subscription.name}", skipping...`
              );
              continue;
            }

            console.log(
              `  📬 Sending ${matchedJobs.length} job(s) for subscription: "${subscription.name}"`
            );

            // Send email
            const emailResult = await sendJobNotifications({
              userEmail: user.email,
              userName: user.username || user.email,
              subscriptionName: subscription.name,
              jobs: matchedJobs,
            });

            if (emailResult.success) {
              console.log(`  ✅ Email sent successfully to ${user.email}`);

              // Mark all notifications as sent
              for (const notification of notifications) {
                await markNotificationAsSent(notification.id);
              }

              sentCount += notifications.length;
            } else {
              console.log(`  ❌ Failed to send email: ${emailResult.error}`);

              // Mark all notifications as failed
              for (const notification of notifications) {
                await markNotificationAsFailed(notification.id, emailResult.error);
              }

              failedCount += notifications.length;
            }
          } catch (error) {
            console.error(`  ❌ Error processing subscription ${subscriptionId}:`, error);

            // Mark notifications as failed
            for (const notification of notifications) {
              await markNotificationAsFailed(
                notification.id,
                error instanceof Error ? error.message : "Unknown error"
              );
            }

            failedCount += notifications.length;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        failedCount += Array.from(subscriptionGroups.values()).flat().length;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`  Total pending: ${pendingNotifications.length}`);
    console.log(`  Successfully sent: ${sentCount}`);
    console.log(`  Failed: ${failedCount}`);
    console.log(`  Completion time: ${new Date().toISOString()}\n`);
  } catch (error) {
    console.error("\n❌ Fatal error in notification send process:", error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log("✅ Notification send process completed\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Notification send process failed:", error);
    process.exit(1);
  });
