import { db, crawlLogs } from "@/db";

import { crawlBossZhipin } from "./boss-zhipin";
import { crawlEleduck } from "./eleduck";
import { crawlHimalayas } from "./himalayas";
import { crawlIndeed } from "./indeed";
import { crawlLagou } from "./lagou";
import { crawlRemoteOK } from "./remoteok";
import { crawlRemotive } from "./remotive";
import { crawlRuanyfWeekly } from "./ruanyf-weekly";
import { crawlV2EX } from "./v2ex";
import { crawlVueJobs } from "./vuejobs";
import { crawlWeWorkRemotely } from "./weworkremotely";
import { crawlXiaohongshu } from "./xiaohongshu";

type CrawlResult = { success: number; failed: number; total: number };

export async function runCrawlers() {
  const results = {
    v2ex: { success: false, message: "", data: null as CrawlResult | null },
    eleduck: { success: false, message: "", data: null as CrawlResult | null },
    remoteok: { success: false, message: "", data: null as CrawlResult | null },
    weworkremotely: { success: false, message: "", data: null as CrawlResult | null },
    vuejobs: { success: false, message: "", data: null as CrawlResult | null },
    ruanyf_weekly: { success: false, message: "", data: null as CrawlResult | null },
    himalayas: { success: false, message: "", data: null as CrawlResult | null },
    remotive: { success: false, message: "", data: null as CrawlResult | null },
    indeed: { success: false, message: "", data: null as CrawlResult | null },
    boss_zhipin: { success: false, message: "", data: null as CrawlResult | null },
    xiaohongshu: { success: false, message: "", data: null as CrawlResult | null },
    lagou: { success: false, message: "", data: null as CrawlResult | null },
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

  // Crawl VueJobs
  try {
    const startTime = Date.now();
    const vuejobsResult = await crawlVueJobs();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "VUEJOBS",
      status: vuejobsResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: vuejobsResult.total,
      successCount: vuejobsResult.success,
      failCount: vuejobsResult.failed,
      duration,
    });

    results.vuejobs = {
      success: true,
      message: `VueJobs: ${vuejobsResult.success} jobs crawled successfully`,
      data: vuejobsResult,
    };
  } catch (error) {
    console.error("VueJobs crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "VUEJOBS",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.vuejobs = {
      success: false,
      message: `VueJobs crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Ruanyf Weekly
  try {
    const startTime = Date.now();
    const ruanyfResult = await crawlRuanyfWeekly();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "RUANYF_WEEKLY",
      status: ruanyfResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: ruanyfResult.total,
      successCount: ruanyfResult.success,
      failCount: ruanyfResult.failed,
      duration,
    });

    results.ruanyf_weekly = {
      success: true,
      message: `Ruanyf Weekly: ${ruanyfResult.success} jobs crawled successfully`,
      data: ruanyfResult,
    };
  } catch (error) {
    console.error("Ruanyf Weekly crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "RUANYF_WEEKLY",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.ruanyf_weekly = {
      success: false,
      message: `Ruanyf Weekly crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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

  // Crawl Indeed
  try {
    const startTime = Date.now();
    const indeedResult = await crawlIndeed();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "INDEED",
      status: indeedResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: indeedResult.total,
      successCount: indeedResult.success,
      failCount: indeedResult.failed,
      duration,
    });

    results.indeed = {
      success: true,
      message: `Indeed: ${indeedResult.success} jobs crawled successfully`,
      data: indeedResult,
    };
  } catch (error) {
    console.error("Indeed crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "INDEED",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.indeed = {
      success: false,
      message: `Indeed crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Boss Zhipin
  try {
    const startTime = Date.now();
    const bossResult = await crawlBossZhipin();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "BOSS_ZHIPIN",
      status: bossResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: bossResult.total,
      successCount: bossResult.success,
      failCount: bossResult.failed,
      duration,
    });

    results.boss_zhipin = {
      success: true,
      message: `Boss Zhipin: ${bossResult.success} jobs crawled successfully`,
      data: bossResult,
    };
  } catch (error) {
    console.error("Boss Zhipin crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "BOSS_ZHIPIN",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.boss_zhipin = {
      success: false,
      message: `Boss Zhipin crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Xiaohongshu
  try {
    const startTime = Date.now();
    const xhsResult = await crawlXiaohongshu();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "XIAOHONGSHU",
      status: xhsResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: xhsResult.total,
      successCount: xhsResult.success,
      failCount: xhsResult.failed,
      duration,
    });

    results.xiaohongshu = {
      success: true,
      message: `Xiaohongshu: ${xhsResult.success} jobs crawled successfully`,
      data: xhsResult,
    };
  } catch (error) {
    console.error("Xiaohongshu crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "XIAOHONGSHU",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.xiaohongshu = {
      success: false,
      message: `Xiaohongshu crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  // Crawl Lagou
  try {
    const startTime = Date.now();
    const lagouResult = await crawlLagou();
    const duration = Date.now() - startTime;

    await db.insert(crawlLogs).values({
      source: "LAGOU",
      status: lagouResult.failed === 0 ? "SUCCESS" : "PARTIAL",
      totalCount: lagouResult.total,
      successCount: lagouResult.success,
      failCount: lagouResult.failed,
      duration,
    });

    results.lagou = {
      success: true,
      message: `Lagou: ${lagouResult.success} jobs crawled successfully`,
      data: lagouResult,
    };
  } catch (error) {
    console.error("Lagou crawler failed:", error);

    await db.insert(crawlLogs).values({
      source: "LAGOU",
      status: "FAILED",
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    results.lagou = {
      success: false,
      message: `Lagou crawler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }

  return results;
}
