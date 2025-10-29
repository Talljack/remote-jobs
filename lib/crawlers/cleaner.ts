import { lt } from "drizzle-orm";

import { db } from "@/db";
import { jobs, crawlLogs } from "@/db/schema";

interface CleanupResult {
  deletedJobs: number;
  deletedLogs: number;
  success: boolean;
  message: string;
}

/**
 * Clean up old data from the database
 * - Deletes jobs older than 90 days
 * - Deletes crawl logs older than 90 days
 */
export async function cleanupOldData(): Promise<CleanupResult> {
  try {
    const startTime = Date.now();

    // Calculate cutoff dates
    const jobsCutoffDate = new Date();
    jobsCutoffDate.setDate(jobsCutoffDate.getDate() - 90);

    const logsCutoffDate = new Date();
    logsCutoffDate.setDate(logsCutoffDate.getDate() - 90);

    console.log(`[Cleaner] Starting cleanup...`);
    console.log(`[Cleaner] Jobs cutoff date: ${jobsCutoffDate.toISOString()}`);
    console.log(`[Cleaner] Logs cutoff date: ${logsCutoffDate.toISOString()}`);

    // Delete old jobs (cascade will delete related records in job_skill_relations, job_tag_relations, bookmarks)
    const deletedJobsResult = await db
      .delete(jobs)
      .where(lt(jobs.publishedAt, jobsCutoffDate))
      .returning({ id: jobs.id });

    const deletedJobsCount = deletedJobsResult.length;

    // Delete old crawl logs
    const deletedLogsResult = await db
      .delete(crawlLogs)
      .where(lt(crawlLogs.createdAt, logsCutoffDate))
      .returning({ id: crawlLogs.id });

    const deletedLogsCount = deletedLogsResult.length;

    const duration = Date.now() - startTime;

    console.log(`[Cleaner] Cleanup completed in ${duration}ms`);
    console.log(`[Cleaner] Deleted ${deletedJobsCount} jobs`);
    console.log(`[Cleaner] Deleted ${deletedLogsCount} crawl logs`);

    return {
      deletedJobs: deletedJobsCount,
      deletedLogs: deletedLogsCount,
      success: true,
      message: `Cleanup completed: ${deletedJobsCount} jobs and ${deletedLogsCount} logs deleted`,
    };
  } catch (error) {
    console.error("[Cleaner] Cleanup failed:", error);

    return {
      deletedJobs: 0,
      deletedLogs: 0,
      success: false,
      message: `Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
