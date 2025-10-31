import { db, crawlLogs } from "@/db";

import { cleanupOldData } from "./cleaner";
import { crawlEleduck } from "./eleduck";
import { crawlFourDayWeek } from "./fourdayweek";
import { crawlHimalayas } from "./himalayas";
import { crawlJobicy } from "./jobicy";
import { crawlRemoteOK } from "./remoteok";
import { crawlRemotive } from "./remotive";
import { crawlV2EX } from "./v2ex";
// import { crawlVueJobs } from "./vuejobs"; // TODO: Fix filtering logic - currently only 5 jobs, all OCCASIONAL
import { crawlWeWorkRemotely } from "./weworkremotely";
import { crawlWorkingNomads } from "./workingnomads";

// Removed ineffective crawlers:
// - crawlBossZhipin: No public API, requires browser automation
// - crawlIndeed: RSS feeds not working
// - crawlLagou: No data
// - crawlXiaohongshu: No public API
// - crawlRuanyfWeekly: Not a job board

type CrawlResult = { success: number; failed: number; total: number };

export async function runCrawlers() {
  const results = {
    v2ex: { success: false, message: "", data: null as CrawlResult | null },
    eleduck: { success: false, message: "", data: null as CrawlResult | null },
    remoteok: { success: false, message: "", data: null as CrawlResult | null },
    weworkremotely: { success: false, message: "", data: null as CrawlResult | null },
    // vuejobs: { success: false, message: "", data: null as CrawlResult | null }, // Temporarily disabled
    himalayas: { success: false, message: "", data: null as CrawlResult | null },
    remotive: { success: false, message: "", data: null as CrawlResult | null },
    jobicy: { success: false, message: "", data: null as CrawlResult | null },
    workingnomads: { success: false, message: "", data: null as CrawlResult | null },
    fourdayweek: { success: false, message: "", data: null as CrawlResult | null },
  };

  // Crawl V2EX
  try {
    const startTime = Date.now();
    const v2exResult = await crawlV2EX();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "V2EX",
      status: v2exResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: v2exResult.total,
      successCount: v2exResult.success,
      failCount: v2exResult.failed,
      duration,
    });

    results.v2ex = {
      success: true,
      message: `V2EX: ${v2exResult.success} jobs crawled successfully`,
      data: v2exResult,
    };
  } catch (error) {
    console.error("V2EX crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "V2EX",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.v2ex = {
      success: false,
      message: `V2EX crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Eleduck
  try {
    const startTime = Date.now();
    const eleduckResult = await crawlEleduck();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "ELEDUCK",
      status: eleduckResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: eleduckResult.total,
      successCount: eleduckResult.success,
      failCount: eleduckResult.failed,
      duration,
    });

    results.eleduck = {
      success: true,
      message: `Eleduck: ${eleduckResult.success} jobs crawled successfully`,
      data: eleduckResult,
    };
  } catch (error) {
    console.error("Eleduck crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "ELEDUCK",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.eleduck = {
      success: false,
      message: `Eleduck crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl RemoteOK
  try {
    const startTime = Date.now();
    const remoteokResult = await crawlRemoteOK();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "REMOTEOK",
      status: remoteokResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: remoteokResult.total,
      successCount: remoteokResult.success,
      failCount: remoteokResult.failed,
      duration,
    });

    results.remoteok = {
      success: true,
      message: `RemoteOK: ${remoteokResult.success} jobs crawled successfully`,
      data: remoteokResult,
    };
  } catch (error) {
    console.error("RemoteOK crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "REMOTEOK",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.remoteok = {
      success: false,
      message: `RemoteOK crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl WeWorkRemotely
  try {
    const startTime = Date.now();
    const wwrResult = await crawlWeWorkRemotely();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "WEWORKREMOTELY",
      status: wwrResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: wwrResult.total,
      successCount: wwrResult.success,
      failCount: wwrResult.failed,
      duration,
    });

    results.weworkremotely = {
      success: true,
      message: `WeWorkRemotely: ${wwrResult.success} jobs crawled successfully`,
      data: wwrResult,
    };
  } catch (error) {
    console.error("WeWorkRemotely crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "WEWORKREMOTELY",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.weworkremotely = {
      success: false,
      message: `WeWorkRemotely crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Himalayas
  try {
    const startTime = Date.now();
    const himalayasResult = await crawlHimalayas();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "HIMALAYAS",
      status: himalayasResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: himalayasResult.total,
      successCount: himalayasResult.success,
      failCount: himalayasResult.failed,
      duration,
    });

    results.himalayas = {
      success: true,
      message: `Himalayas: ${himalayasResult.success} jobs crawled successfully`,
      data: himalayasResult,
    };
  } catch (error) {
    console.error("Himalayas crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "HIMALAYAS",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.himalayas = {
      success: false,
      message: `Himalayas crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Remotive
  try {
    const startTime = Date.now();
    const remotiveResult = await crawlRemotive();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "REMOTIVE",
      status: remotiveResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: remotiveResult.total,
      successCount: remotiveResult.success,
      failCount: remotiveResult.failed,
      duration,
    });

    results.remotive = {
      success: true,
      message: `Remotive: ${remotiveResult.success} jobs crawled successfully`,
      data: remotiveResult,
    };
  } catch (error) {
    console.error("Remotive crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "REMOTIVE",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.remotive = {
      success: false,
      message: `Remotive crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Jobicy
  try {
    const startTime = Date.now();
    const jobicyResult = await crawlJobicy();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "JOBICY",
      status: jobicyResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: jobicyResult.total,
      successCount: jobicyResult.success,
      failCount: jobicyResult.failed,
      duration,
    });

    results.jobicy = {
      success: true,
      message: `Jobicy: ${jobicyResult.success} jobs crawled successfully`,
      data: jobicyResult,
    };
  } catch (error) {
    console.error("Jobicy crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "JOBICY",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.jobicy = {
      success: false,
      message: `Jobicy crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Working Nomads
  try {
    const startTime = Date.now();
    const workingnomadsResult = await crawlWorkingNomads();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "WORKING_NOMADS",
      status: workingnomadsResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: workingnomadsResult.total,
      successCount: workingnomadsResult.success,
      failCount: workingnomadsResult.failed,
      duration,
    });

    results.workingnomads = {
      success: true,
      message: `Working Nomads: ${workingnomadsResult.success} jobs crawled successfully`,
      data: workingnomadsResult,
    };
  } catch (error) {
    console.error("Working Nomads crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "WORKING_NOMADS",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.workingnomads = {
      success: false,
      message: `Working Nomads crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl 4 Day Week
  try {
    const startTime = Date.now();
    const fourdayweekResult = await crawlFourDayWeek();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "FOURDAYWEEK",
      status: fourdayweekResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: fourdayweekResult.total,
      successCount: fourdayweekResult.success,
      failCount: fourdayweekResult.failed,
      duration,
    });

    results.fourdayweek = {
      success: true,
      message: `4 Day Week: ${fourdayweekResult.success} jobs crawled successfully`,
      data: fourdayweekResult,
    };
  } catch (error) {
    console.error("4 Day Week crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "FOURDAYWEEK",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.fourdayweek = {
      success: false,
      message: `4 Day Week crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Cleanup old data after all crawlers have run
  try {
    console.log("\n🧹 Starting data cleanup...");
    const cleanupResult = await cleanupOldData();
    console.log(
      `✅ Cleanup ${cleanupResult.success ? "completed" : "failed"}: ${cleanupResult.message}\n`
    );
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    console.log("Continuing despite cleanup failure...\n");
  }

  return results;
}
