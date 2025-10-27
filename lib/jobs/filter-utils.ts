import type { ReadonlyURLSearchParams } from "next/navigation";

import { eq, inArray, like, or, gte, lte, SQL } from "drizzle-orm";

import { jobs } from "@/db";

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const REMOTE_TYPES = ["FULLY_REMOTE", "HYBRID", "OCCASIONAL"] as const;
const JOB_SOURCES = [
  "V2EX",
  "ELEDUCK",
  "REMOTEOK",
  "WEWORKREMOTELY",
  "VUEJOBS",
  "RUANYF_WEEKLY",
  "HIMALAYAS",
  "REMOTIVE",
  "INDEED",
  "BOSS_ZHIPIN",
  "XIAOHONGSHU",
  "LAGOU",
  "USER_POSTED",
] as const;

type JobType = (typeof JOB_TYPES)[number];
type RemoteType = (typeof REMOTE_TYPES)[number];
type JobSource = (typeof JOB_SOURCES)[number];

export interface ParsedJobFilters {
  keyword: string;
  types: JobType[];
  remoteTypes: RemoteType[];
  sources: JobSource[];
  categories: string[];
  salaryMin?: number;
  salaryMax?: number;
  publishedDate?: "today" | "week" | "month" | "all";
}

interface BuildConditionsOptions {
  includeCategory?: boolean;
  includeSource?: boolean;
  includeType?: boolean;
  includeRemoteType?: boolean;
}

const unique = (values: string[]) => Array.from(new Set(values));

export const parseJobFilters = (
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): ParsedJobFilters => {
  // Convert to regular URLSearchParams for consistent handling
  let params: URLSearchParams;
  if (searchParams instanceof URLSearchParams) {
    params = searchParams;
  } else {
    // ReadonlyURLSearchParams needs to be converted
    params = new URLSearchParams();
    // @ts-expect-error - ReadonlyURLSearchParams forEach is not in type definitions
    searchParams.forEach((value: string, key: string) => {
      params.append(key, value);
    });
  }

  const keyword = (params.get("keyword") || params.get("q") || "").trim();

  const parseMulti = (key: string) =>
    unique(
      params
        .getAll(key)
        .map((value) => value.trim())
        .filter(Boolean)
    );

  const types = parseMulti("type").filter((value): value is JobType =>
    JOB_TYPES.includes(value as JobType)
  );

  const remoteTypes = parseMulti("remoteType").filter((value): value is RemoteType =>
    REMOTE_TYPES.includes(value as RemoteType)
  );

  const sources = parseMulti("source").filter((value): value is JobSource =>
    JOB_SOURCES.includes(value as JobSource)
  );

  const categories = parseMulti("category");

  const salaryMinRaw = params.get("salaryMin");
  const salaryMaxRaw = params.get("salaryMax");

  const salaryMin = salaryMinRaw ? Number.parseInt(salaryMinRaw, 10) : undefined;
  const salaryMax = salaryMaxRaw ? Number.parseInt(salaryMaxRaw, 10) : undefined;

  const publishedDateRaw = params.get("publishedDate")?.trim();
  const publishedDate =
    publishedDateRaw && ["today", "week", "month", "all"].includes(publishedDateRaw)
      ? (publishedDateRaw as ParsedJobFilters["publishedDate"])
      : undefined;

  return {
    keyword,
    types,
    remoteTypes,
    sources,
    categories,
    salaryMin: Number.isFinite(salaryMin ?? NaN) ? salaryMin : undefined,
    salaryMax: Number.isFinite(salaryMax ?? NaN) ? salaryMax : undefined,
    publishedDate,
  };
};

export const buildJobConditions = (
  filters: ParsedJobFilters,
  options: BuildConditionsOptions = {}
): SQL[] => {
  const conditions: SQL[] = [eq(jobs.status, "PUBLISHED")];

  if (filters.keyword) {
    const keywordCondition = or(
      like(jobs.title, `%${filters.keyword}%`),
      like(jobs.companyName, `%${filters.keyword}%`),
      like(jobs.description, `%${filters.keyword}%`)
    );
    if (keywordCondition) {
      conditions.push(keywordCondition);
    }
  }

  if (options.includeType !== false && filters.types.length > 0) {
    if (filters.types.length === 1) {
      conditions.push(eq(jobs.type, filters.types[0]));
    } else {
      conditions.push(inArray(jobs.type, filters.types));
    }
  }

  if (options.includeRemoteType !== false && filters.remoteTypes.length > 0) {
    if (filters.remoteTypes.length === 1) {
      conditions.push(eq(jobs.remoteType, filters.remoteTypes[0]));
    } else {
      conditions.push(inArray(jobs.remoteType, filters.remoteTypes));
    }
  }

  if (options.includeSource !== false && filters.sources.length > 0) {
    if (filters.sources.length === 1) {
      conditions.push(eq(jobs.source, filters.sources[0]));
    } else {
      conditions.push(inArray(jobs.source, filters.sources));
    }
  }

  if (options.includeCategory !== false && filters.categories.length > 0) {
    if (filters.categories.length === 1) {
      conditions.push(eq(jobs.categoryId, filters.categories[0]));
    } else {
      conditions.push(inArray(jobs.categoryId, filters.categories));
    }
  }

  if (typeof filters.salaryMin === "number" && Number.isFinite(filters.salaryMin)) {
    conditions.push(gte(jobs.salaryMin, filters.salaryMin));
  }

  if (typeof filters.salaryMax === "number" && Number.isFinite(filters.salaryMax)) {
    conditions.push(lte(jobs.salaryMax, filters.salaryMax));
  }

  if (filters.publishedDate && filters.publishedDate !== "all") {
    const now = new Date();
    let dateThreshold: Date | undefined;

    switch (filters.publishedDate) {
      case "today":
        dateThreshold = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        dateThreshold = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        dateThreshold = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        dateThreshold = undefined;
    }

    if (dateThreshold) {
      conditions.push(gte(jobs.publishedAt, dateThreshold));
    }
  }

  return conditions;
};
