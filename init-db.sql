-- Initialize database schema for RemoteJobs platform

-- Drop existing types if they exist (for clean re-run)
DROP TYPE IF EXISTS "public"."crawl_status" CASCADE;
DROP TYPE IF EXISTS "public"."job_source" CASCADE;
DROP TYPE IF EXISTS "public"."job_status" CASCADE;
DROP TYPE IF EXISTS "public"."job_type" CASCADE;
DROP TYPE IF EXISTS "public"."remote_type" CASCADE;
DROP TYPE IF EXISTS "public"."user_role" CASCADE;

-- Create enums
CREATE TYPE "public"."crawl_status" AS ENUM('SUCCESS', 'FAILED', 'PARTIAL');
CREATE TYPE "public"."job_source" AS ENUM('V2EX', 'ELEDUCK', 'USER_POSTED');
CREATE TYPE "public"."job_status" AS ENUM('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "public"."job_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
CREATE TYPE "public"."remote_type" AS ENUM('FULLY_REMOTE', 'HYBRID', 'OCCASIONAL');
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
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

-- Create jobs table
CREATE TABLE IF NOT EXISTS "jobs" (
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create job_tags table
CREATE TABLE IF NOT EXISTS "job_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "job_tags_slug_unique" UNIQUE("slug")
);

-- Create job_tag_relations table
CREATE TABLE IF NOT EXISTS "job_tag_relations" (
	"job_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "job_tag_relations_job_id_tag_id_pk" PRIMARY KEY("job_id","tag_id")
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create crawl_logs table
CREATE TABLE IF NOT EXISTS "crawl_logs" (
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

-- Add foreign keys
ALTER TABLE "bookmarks" DROP CONSTRAINT IF EXISTS "bookmarks_user_id_users_id_fk";
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bookmarks" DROP CONSTRAINT IF EXISTS "bookmarks_job_id_jobs_id_fk";
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "job_tag_relations" DROP CONSTRAINT IF EXISTS "job_tag_relations_job_id_jobs_id_fk";
ALTER TABLE "job_tag_relations" ADD CONSTRAINT "job_tag_relations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "job_tag_relations" DROP CONSTRAINT IF EXISTS "job_tag_relations_tag_id_job_tags_id_fk";
ALTER TABLE "job_tag_relations" ADD CONSTRAINT "job_tag_relations_tag_id_job_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."job_tags"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_publisher_id_users_id_fk";
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_publisher_id_users_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "bookmarks_user_job_idx" ON "bookmarks" USING btree ("user_id","job_id");
CREATE INDEX IF NOT EXISTS "jobs_title_idx" ON "jobs" USING btree ("title");
CREATE INDEX IF NOT EXISTS "jobs_company_idx" ON "jobs" USING btree ("company_name");
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "jobs_published_at_idx" ON "jobs" USING btree ("published_at");
CREATE INDEX IF NOT EXISTS "jobs_source_idx" ON "jobs" USING btree ("source");
CREATE INDEX IF NOT EXISTS "jobs_publisher_idx" ON "jobs" USING btree ("publisher_id");
