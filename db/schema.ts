import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uuid,
  primaryKey,
  index,
  unique,
  PgColumn,
} from "drizzle-orm/pg-core";

// Enums
export const jobTypeEnum = pgEnum("job_type", ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]);

export const remoteTypeEnum = pgEnum("remote_type", ["FULLY_REMOTE", "HYBRID", "OCCASIONAL"]);

export const jobSourceEnum = pgEnum("job_source", [
  "V2EX",
  "ELEDUCK",
  "REMOTEOK",
  "WEWORKREMOTELY",
  "VUEJOBS",
  "RUANYF_WEEKLY",
  "HIMALAYAS",
  "REMOTIVE",
  "BOSS_ZHIPIN",
  "XIAOHONGSHU",
  "LAGOU",
  "INDEED",
  "USER_POSTED",
]);

export const jobStatusEnum = pgEnum("job_status", ["DRAFT", "PUBLISHED", "CLOSED"]);

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

export const crawlStatusEnum = pgEnum("crawl_status", ["SUCCESS", "FAILED", "PARTIAL"]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "ENTRY",
  "MID",
  "SENIOR",
  "LEAD",
  "STAFF",
  "PRINCIPAL",
]);

export const skillCategoryEnum = pgEnum("skill_category", [
  "LANGUAGE",
  "FRAMEWORK",
  "DATABASE",
  "CLOUD",
  "TOOL",
  "SOFT_SKILL",
]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("USER").notNull(),
  emailNotification: boolean("email_notification").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job categories table
export const jobCategories = pgTable("job_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: uuid("parent_id").references((): PgColumn => jobCategories.id),
  description: text("description"),
  icon: text("icon"),
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Skills table
export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  category: skillCategoryEnum("category"),
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jobs table
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    companyName: text("company_name").notNull(),
    companyLogo: text("company_logo"),
    companyWebsite: text("company_website"),
    type: jobTypeEnum("type").notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency").default("USD"),
    remoteType: remoteTypeEnum("remote_type").notNull(),
    location: text("location"),
    description: text("description").notNull(),
    requirements: text("requirements"),
    applyMethod: text("apply_method").notNull(),
    source: jobSourceEnum("source").notNull(),
    sourceUrl: text("source_url"),
    status: jobStatusEnum("status").default("PUBLISHED").notNull(),
    views: integer("views").default(0).notNull(),
    bookmarkCount: integer("bookmark_count").default(0).notNull(),
    publisherId: text("publisher_id").references(() => users.id),
    publishedAt: timestamp("published_at"),
    // New fields
    categoryId: uuid("category_id").references(() => jobCategories.id),
    experienceLevel: experienceLevelEnum("experience_level"),
    timezone: text("timezone"),
    benefits: text("benefits").array(),
    applicationDeadline: timestamp("application_deadline"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index("jobs_title_idx").on(table.title),
    companyIdx: index("jobs_company_idx").on(table.companyName),
    statusIdx: index("jobs_status_idx").on(table.status),
    publishedAtIdx: index("jobs_published_at_idx").on(table.publishedAt),
    sourceIdx: index("jobs_source_idx").on(table.source),
    publisherIdx: index("jobs_publisher_idx").on(table.publisherId),
    categoryIdx: index("jobs_category_idx").on(table.categoryId),
    experienceIdx: index("jobs_experience_idx").on(table.experienceLevel),
    sourceUrlUnique: unique("jobs_source_url_source_unique").on(table.sourceUrl, table.source),
  })
);

// Job tags table
export const jobTags = pgTable("job_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job-Tag relation table (many-to-many)
export const jobTagRelations = pgTable(
  "job_tag_relations",
  {
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => jobTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.jobId, table.tagId] }),
  })
);

// Job-Skill relation table (many-to-many)
export const jobSkillRelations = pgTable(
  "job_skill_relations",
  {
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.jobId, table.skillId] }),
  })
);

// Bookmarks table
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userJobIdx: index("bookmarks_user_job_idx").on(table.userId, table.jobId),
  })
);

// Crawl logs table
export const crawlLogs = pgTable("crawl_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: jobSourceEnum("source").notNull(),
  status: crawlStatusEnum("status").notNull(),
  totalCount: integer("total_count").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  failCount: integer("fail_count").default(0).notNull(),
  duration: integer("duration"), // in milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  bookmarks: many(bookmarks),
}));

export const jobCategoriesRelations = relations(jobCategories, ({ one, many }) => ({
  parent: one(jobCategories, {
    fields: [jobCategories.parentId],
    references: [jobCategories.id],
  }),
  children: many(jobCategories),
  jobs: many(jobs),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  jobs: many(jobSkillRelations),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  publisher: one(users, {
    fields: [jobs.publisherId],
    references: [users.id],
  }),
  category: one(jobCategories, {
    fields: [jobs.categoryId],
    references: [jobCategories.id],
  }),
  tags: many(jobTagRelations),
  skills: many(jobSkillRelations),
  bookmarks: many(bookmarks),
}));

export const jobTagsRelations = relations(jobTags, ({ many }) => ({
  jobs: many(jobTagRelations),
}));

export const jobTagRelationsRelations = relations(jobTagRelations, ({ one }) => ({
  job: one(jobs, {
    fields: [jobTagRelations.jobId],
    references: [jobs.id],
  }),
  tag: one(jobTags, {
    fields: [jobTagRelations.tagId],
    references: [jobTags.id],
  }),
}));

export const jobSkillRelationsRelations = relations(jobSkillRelations, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSkillRelations.jobId],
    references: [jobs.id],
  }),
  skill: one(skills, {
    fields: [jobSkillRelations.skillId],
    references: [skills.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [bookmarks.jobId],
    references: [jobs.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobCategory = typeof jobCategories.$inferSelect;
export type NewJobCategory = typeof jobCategories.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type JobTag = typeof jobTags.$inferSelect;
export type NewJobTag = typeof jobTags.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type CrawlLog = typeof crawlLogs.$inferSelect;
export type NewCrawlLog = typeof crawlLogs.$inferInsert;

// Enum value types
export type SkillCategory = (typeof skillCategoryEnum.enumValues)[number];
