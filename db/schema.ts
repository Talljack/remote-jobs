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
  // Active sources
  "V2EX",
  "ELEDUCK",
  "REMOTEOK",
  "WEWORKREMOTELY",
  "HIMALAYAS",
  "REMOTIVE",
  "JOBICY", // International remote jobs API
  "WORKING_NOMADS", // International remote jobs API
  "FOURDAYWEEK", // 4-day week jobs
  "REMOTEBASE", // Tech jobs platform
  // User posted
  "USER_POSTED",
  // Deprecated/inactive sources (keep for existing data)
  "VUEJOBS", // TODO: Fix filtering
  "RUANYF_WEEKLY", // Not a job board
  "BOSS_ZHIPIN", // No public API
  "XIAOHONGSHU", // No public API
  "LAGOU", // No data
  "INDEED", // RSS not working
  "JUSTREMOTE", // No public API
  "DYNAMITE_JOBS", // No public RSS feed
  "JOBSPRESSO", // No public RSS feed
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

export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", [
  "DAILY",
  "WEEKLY",
  "IMMEDIATE", // Instant notification when matching job is found
]);

export const notificationStatusEnum = pgEnum("notification_status", ["PENDING", "SENT", "FAILED"]);

export const auditActionEnum = pgEnum("audit_action", [
  "JOB_APPROVE",
  "JOB_REJECT",
  "JOB_DELETE",
  "USER_BAN",
  "USER_UNBAN",
  "USER_ROLE_CHANGE",
  "CRAWLER_CONFIG_UPDATE",
  "SYSTEM_CONFIG_UPDATE",
]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("USER").notNull(),
  emailNotification: boolean("email_notification").default(true).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  bannedAt: timestamp("banned_at"),
  bannedReason: text("banned_reason"),
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

// Job subscriptions table
export const jobSubscriptions = pgTable(
  "job_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Subscription name (e.g., "Frontend Jobs")
    isActive: boolean("is_active").default(true).notNull(),
    frequency: subscriptionFrequencyEnum("frequency").default("DAILY").notNull(),
    // Filter criteria
    keywords: text("keywords").array(), // Search keywords
    jobTypes: text("job_types").array(), // Job types to match
    remoteTypes: text("remote_types").array(), // Remote types to match
    sources: text("sources").array(), // Sources to monitor
    salaryMin: integer("salary_min"),
    categoryId: uuid("category_id").references(() => jobCategories.id),
    experienceLevel: text("experience_level"),
    // Notification settings
    lastNotifiedAt: timestamp("last_notified_at"),
    notificationCount: integer("notification_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("subscriptions_user_idx").on(table.userId),
    activeIdx: index("subscriptions_active_idx").on(table.isActive),
  })
);

// Subscription tags (many-to-many)
export const subscriptionTagRelations = pgTable(
  "subscription_tag_relations",
  {
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => jobSubscriptions.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => jobTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.subscriptionId, table.tagId] }),
  })
);

// Notification queue table
export const notificationQueue = pgTable(
  "notification_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => jobSubscriptions.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: notificationStatusEnum("status").default("PENDING").notNull(),
    scheduledFor: timestamp("scheduled_for").notNull(), // When to send
    sentAt: timestamp("sent_at"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("notifications_status_idx").on(table.status),
    scheduledIdx: index("notifications_scheduled_idx").on(table.scheduledFor),
    userIdx: index("notifications_user_idx").on(table.userId),
  })
);

// Audit logs table (for admin actions)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: text("admin_id")
      .notNull()
      .references(() => users.id),
    action: auditActionEnum("action").notNull(),
    targetType: text("target_type").notNull(), // "job", "user", "config"
    targetId: text("target_id"), // ID of the affected resource
    details: text("details"), // JSON string with additional details
    metadata: text("metadata"), // JSON string with before/after state
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    adminIdx: index("audit_logs_admin_idx").on(table.adminId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    targetIdx: index("audit_logs_target_idx").on(table.targetType, table.targetId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  bookmarks: many(bookmarks),
  subscriptions: many(jobSubscriptions),
  notifications: many(notificationQueue),
  auditLogs: many(auditLogs),
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

export const jobSubscriptionsRelations = relations(jobSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [jobSubscriptions.userId],
    references: [users.id],
  }),
  category: one(jobCategories, {
    fields: [jobSubscriptions.categoryId],
    references: [jobCategories.id],
  }),
  tags: many(subscriptionTagRelations),
  notifications: many(notificationQueue),
}));

export const subscriptionTagRelationsRelations = relations(subscriptionTagRelations, ({ one }) => ({
  subscription: one(jobSubscriptions, {
    fields: [subscriptionTagRelations.subscriptionId],
    references: [jobSubscriptions.id],
  }),
  tag: one(jobTags, {
    fields: [subscriptionTagRelations.tagId],
    references: [jobTags.id],
  }),
}));

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  user: one(users, {
    fields: [notificationQueue.userId],
    references: [users.id],
  }),
  subscription: one(jobSubscriptions, {
    fields: [notificationQueue.subscriptionId],
    references: [jobSubscriptions.id],
  }),
  job: one(jobs, {
    fields: [notificationQueue.jobId],
    references: [jobs.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
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
export type JobSubscription = typeof jobSubscriptions.$inferSelect;
export type NewJobSubscription = typeof jobSubscriptions.$inferInsert;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type NewNotificationQueue = typeof notificationQueue.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Enum value types
export type SkillCategory = (typeof skillCategoryEnum.enumValues)[number];
export type SubscriptionFrequency = (typeof subscriptionFrequencyEnum.enumValues)[number];
export type NotificationStatus = (typeof notificationStatusEnum.enumValues)[number];
export type AuditAction = (typeof auditActionEnum.enumValues)[number];
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobSource = (typeof jobSourceEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
