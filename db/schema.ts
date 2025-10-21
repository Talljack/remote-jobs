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
} from "drizzle-orm/pg-core";

// Enums
export const jobTypeEnum = pgEnum("job_type", ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]);

export const remoteTypeEnum = pgEnum("remote_type", ["FULLY_REMOTE", "HYBRID", "OCCASIONAL"]);

export const jobSourceEnum = pgEnum("job_source", ["V2EX", "ELEDUCK", "USER_POSTED"]);

export const jobStatusEnum = pgEnum("job_status", ["DRAFT", "PUBLISHED", "CLOSED"]);

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

export const crawlStatusEnum = pgEnum("crawl_status", ["SUCCESS", "FAILED", "PARTIAL"]);

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

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  publisher: one(users, {
    fields: [jobs.publisherId],
    references: [users.id],
  }),
  tags: many(jobTagRelations),
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
export type JobTag = typeof jobTags.$inferSelect;
export type NewJobTag = typeof jobTags.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type CrawlLog = typeof crawlLogs.$inferSelect;
export type NewCrawlLog = typeof crawlLogs.$inferInsert;
