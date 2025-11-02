-- Step 1: Create all database schema (from drizzle migration)
-- Run this first to create all tables

-- Create ENUMs
CREATE TYPE "public"."crawl_status" AS ENUM('SUCCESS', 'FAILED', 'PARTIAL');
CREATE TYPE "public"."experience_level" AS ENUM('ENTRY', 'MID', 'SENIOR', 'LEAD', 'STAFF', 'PRINCIPAL');
CREATE TYPE "public"."job_source" AS ENUM('V2EX', 'ELEDUCK', 'REMOTEOK', 'WEWORKREMOTELY', 'VUEJOBS', 'RUANYF_WEEKLY', 'HIMALAYAS', 'REMOTIVE', 'JOBICY', 'WORKING_NOMADS', 'FOURDAYWEEK', 'REMOTEBASE', 'BOSS_ZHIPIN', 'XIAOHONGSHU', 'LAGOU', 'INDEED', 'USER_POSTED');
CREATE TYPE "public"."job_status" AS ENUM('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "public"."job_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
CREATE TYPE "public"."remote_type" AS ENUM('FULLY_REMOTE', 'HYBRID', 'OCCASIONAL');
CREATE TYPE "public"."skill_category" AS ENUM('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'CLOUD', 'TOOL', 'SOFT_SKILL');
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');

-- Create Tables
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"email_notification" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "job_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"description" text,
	"icon" text,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_slug_unique" UNIQUE("slug")
);

CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "skill_category",
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name"),
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);

CREATE TABLE "job_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "job_tags_slug_unique" UNIQUE("slug")
);

CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company_name" text NOT NULL,
	"company_logo" text,
	"company_website" text,
	"type" "job_type" NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text DEFAULT 'USD',
	"remote_type" "remote_type" NOT NULL,
	"location" text,
	"description" text NOT NULL,
	"requirements" text,
	"apply_method" text NOT NULL,
	"source" "job_source" NOT NULL,
	"source_url" text,
	"status" "job_status" DEFAULT 'PUBLISHED' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"publisher_id" text,
	"published_at" timestamp,
	"category_id" uuid,
	"experience_level" "experience_level",
	"timezone" text,
	"benefits" text[],
	"application_deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "job_skill_relations" (
	"job_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "job_skill_relations_job_id_skill_id_pk" PRIMARY KEY("job_id","skill_id")
);

CREATE TABLE "job_tag_relations" (
	"job_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "job_tag_relations_job_id_tag_id_pk" PRIMARY KEY("job_id","tag_id")
);

CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "crawl_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "job_source" NOT NULL,
	"status" "crawl_status" NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"duration" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add Foreign Keys
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parent_id_job_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_publisher_id_users_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "job_skill_relations" ADD CONSTRAINT "job_skill_relations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "job_skill_relations" ADD CONSTRAINT "job_skill_relations_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "job_tag_relations" ADD CONSTRAINT "job_tag_relations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "job_tag_relations" ADD CONSTRAINT "job_tag_relations_tag_id_job_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."job_tags"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;

-- Create Indexes
CREATE INDEX "jobs_title_idx" ON "jobs" USING btree ("title");
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company_name");
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");
CREATE INDEX "jobs_published_at_idx" ON "jobs" USING btree ("published_at");
CREATE INDEX "jobs_source_idx" ON "jobs" USING btree ("source");
CREATE INDEX "jobs_publisher_idx" ON "jobs" USING btree ("publisher_id");
CREATE INDEX "jobs_category_idx" ON "jobs" USING btree ("category_id");
CREATE INDEX "jobs_experience_idx" ON "jobs" USING btree ("experience_level");
CREATE INDEX "bookmarks_user_job_idx" ON "bookmarks" USING btree ("user_id","job_id");
