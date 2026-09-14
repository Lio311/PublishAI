CREATE TYPE "public"."stage" AS ENUM('clarification', 'planning', 'knowledge', 'scientific_review', 'writing', 'execution', 'qa', 'verification', 'compilation');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'in_progress', 'awaiting_approval', 'approved', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "journals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"field" text,
	"instructions_url" text,
	"rules" jsonb,
	"citation_style" text,
	"word_limit" integer,
	"abstract_limit" integer
);
--> statement-breakpoint
CREATE TABLE "paper_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id" serial NOT NULL,
	"stage" "stage",
	"status" "status" DEFAULT 'pending',
	"agent_output" text,
	"user_feedback" text,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "paper_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id" serial NOT NULL,
	"version_number" serial NOT NULL,
	"file_url" text,
	"format" text,
	"changes_summary" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"status" "status" DEFAULT 'pending',
	"target_journal_id" serial NOT NULL,
	"original_file_url" text,
	"original_format" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id" serial NOT NULL,
	"citation_key" text,
	"title" text,
	"authors" text,
	"year" text,
	"doi" text,
	"source" text,
	"bibtex_entry" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"academic_role" text,
	"language" text DEFAULT 'he',
	"email_notifications" boolean DEFAULT true,
	"browser_notifications" boolean DEFAULT false,
	"weekly_digest" boolean DEFAULT true,
	"public_profile" boolean DEFAULT true,
	"data_collection_for_ai" boolean DEFAULT false,
	"openai_api_key" text,
	"anthropic_api_key" text,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_stages" ADD CONSTRAINT "paper_stages_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_versions" ADD CONSTRAINT "paper_versions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_target_journal_id_journals_id_fk" FOREIGN KEY ("target_journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;