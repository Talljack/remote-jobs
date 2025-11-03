-- Migration for Job Subscriptions and Admin Backend
-- Generated: 2025-11-02

-- Create new enums
CREATE TYPE IF NOT EXISTS "public"."audit_action" AS ENUM('JOB_APPROVE', 'JOB_REJECT', 'JOB_DELETE', 'USER_BAN', 'USER_UNBAN', 'USER_ROLE_CHANGE', 'CRAWLER_CONFIG_UPDATE', 'SYSTEM_CONFIG_UPDATE');
CREATE TYPE IF NOT EXISTS "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');
CREATE TYPE IF NOT EXISTS "public"."subscription_frequency" AS ENUM('DAILY', 'WEEKLY', 'IMMEDIATE');

-- Update users table for admin features
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_banned" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_reason" text;

-- Create job subscriptions table
CREATE TABLE IF NOT EXISTS "job_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"frequency" "subscription_frequency" DEFAULT 'DAILY' NOT NULL,
	"keywords" text[],
	"job_types" text[],
	"remote_types" text[],
	"sources" text[],
	"salary_min" integer,
	"category_id" uuid,
	"experience_level" text,
	"last_notified_at" timestamp,
	"notification_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "job_subscriptions_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action
);

-- Create notification queue table
CREATE TABLE IF NOT EXISTS "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "notification_queue_subscription_id_job_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."job_subscriptions"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "notification_queue_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action
);

-- Create subscription tag relations table
CREATE TABLE IF NOT EXISTS "subscription_tag_relations" (
	"subscription_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "subscription_tag_relations_subscription_id_tag_id_pk" PRIMARY KEY("subscription_id","tag_id"),
	CONSTRAINT "subscription_tag_relations_subscription_id_job_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."job_subscriptions"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "subscription_tag_relations_tag_id_job_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."job_tags"("id") ON DELETE cascade ON UPDATE no action
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"details" text,
	"metadata" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "job_subscriptions" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "subscriptions_active_idx" ON "job_subscriptions" USING btree ("is_active");
CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notification_queue" USING btree ("status");
CREATE INDEX IF NOT EXISTS "notifications_scheduled_idx" ON "notification_queue" USING btree ("scheduled_for");
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notification_queue" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_admin_idx" ON "audit_logs" USING btree ("admin_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
