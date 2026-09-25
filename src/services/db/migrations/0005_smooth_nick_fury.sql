CREATE TYPE "public"."captcha_strategy" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."rpa_job_status" AS ENUM('pending', 'running', 'paused', 'completed', 'error');--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'rejected';--> statement-breakpoint
CREATE TABLE "agent_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_name" text NOT NULL,
	"input_context" text NOT NULL,
	"ai_output" text NOT NULL,
	"rating" integer,
	"feedback_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"description" text,
	"metadata" jsonb,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rpa_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" integer NOT NULL,
	"status" "rpa_job_status" DEFAULT 'pending' NOT NULL,
	"current_step" text,
	"state_data" jsonb,
	"error_log" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
ALTER TABLE "journal_connections" ADD COLUMN "captcha_strategy" "captcha_strategy" DEFAULT 'auto';--> statement-breakpoint
ALTER TABLE "paper_versions" ADD COLUMN "rebuttal_letter" text;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "current_journal_id" integer;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "cascade_queue" jsonb;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "rejections" jsonb;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "suggested_journals" jsonb;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "doi" text;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "citations_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "last_citation_check" timestamp;--> statement-breakpoint
ALTER TABLE "review_threads" ADD COLUMN "email_thread_id" text;--> statement-breakpoint
ALTER TABLE "review_threads" ADD COLUMN "email_message_id" text;--> statement-breakpoint
ALTER TABLE "review_threads" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "remote_last_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "auto_reply_revisions" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_source_id_entities_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_target_id_entities_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rpa_jobs" ADD CONSTRAINT "rpa_jobs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_current_journal_id_journals_id_fk" FOREIGN KEY ("current_journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;