CREATE TYPE "public"."connection_status" AS ENUM('untested', 'connected', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."journal_platform" AS ENUM('wordpress', 'ojs');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('preparing', 'submitting', 'submitted', 'failed', 'draft');--> statement-breakpoint
CREATE TABLE "journal_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"journal_id" integer,
	"platform" "journal_platform" NOT NULL,
	"site_url" text NOT NULL,
	"display_name" text,
	"encrypted_username" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"connection_status" "connection_status" DEFAULT 'untested',
	"last_tested_at" timestamp,
	"last_error" text,
	"remote_user_display_name" text,
	"remote_user_role" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submission_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"level" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id" integer NOT NULL,
	"connection_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"submission_status" "submission_status" DEFAULT 'preparing',
	"publish_mode" text DEFAULT 'draft',
	"remote_post_id" text,
	"remote_post_url" text,
	"confirmation_id" text,
	"response_data" jsonb,
	"attempt_count" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"last_attempt_at" timestamp,
	"next_retry_at" timestamp,
	"error_log" text,
	"submitted_title" text,
	"submitted_abstract" text,
	"submitted_keywords" jsonb,
	"submitted_authors" jsonb,
	"submitted_article_type" text,
	"cover_letter_included" boolean DEFAULT false,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "journal_connections" ADD CONSTRAINT "journal_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_connections" ADD CONSTRAINT "journal_connections_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_logs" ADD CONSTRAINT "submission_logs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_connection_id_journal_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."journal_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;