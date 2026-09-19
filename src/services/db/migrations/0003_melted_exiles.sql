CREATE EXTENSION IF NOT EXISTS vector;

ALTER TYPE "public"."stage" ADD VALUE 'rebuttal';--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid,
	"paper_id" integer,
	"citation_key" text,
	"title" text NOT NULL,
	"authors" text,
	"journal" text,
	"year" integer,
	"volume" text,
	"issue" text,
	"pages" text,
	"doi" text,
	"pmid" text,
	"pmcid" text,
	"arxiv_id" text,
	"url" text,
	"source" text,
	"bibtex" text,
	"abstract" text,
	"raw_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"paper_id" integer,
	"title" text NOT NULL,
	"abstract" text,
	"content" text,
	"status" text DEFAULT 'draft',
	"file_url" text,
	"file_type" text,
	"word_count" integer DEFAULT 0,
	"target_journal_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"comment_number" integer,
	"reviewer_text" text NOT NULL,
	"ai_drafted_response" text,
	"author_final_response" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"category" text,
	"severity" text,
	"suggested_action" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"title" text,
	"reviewer_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"round_number" integer DEFAULT 1,
	"raw_report" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"event_type" text,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_files" DROP CONSTRAINT "data_files_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "debates" DROP CONSTRAINT "debates_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "figures" DROP CONSTRAINT "figures_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "generated_charts" DROP CONSTRAINT "generated_charts_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "paper_stages" DROP CONSTRAINT "paper_stages_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "paper_versions" DROP CONSTRAINT "paper_versions_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "papers" DROP CONSTRAINT "papers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "references" DROP CONSTRAINT "references_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "sandbox_runs" DROP CONSTRAINT "sandbox_runs_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_paper_id_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "paper_stages" ALTER COLUMN "paper_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "paper_stages" ALTER COLUMN "paper_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "paper_versions" ALTER COLUMN "paper_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "paper_versions" ALTER COLUMN "paper_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "paper_versions" ALTER COLUMN "version_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "paper_versions" ALTER COLUMN "version_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "papers" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "papers" ALTER COLUMN "target_journal_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "papers" ALTER COLUMN "target_journal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "references" ALTER COLUMN "paper_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "references" ALTER COLUMN "paper_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId");--> statement-breakpoint
ALTER TABLE "verificationToken" ADD CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token");--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "credits" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_target_journal_id_journals_id_fk" FOREIGN KEY ("target_journal_id") REFERENCES "public"."journals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_thread_id_review_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."review_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_threads" ADD CONSTRAINT "review_threads_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_events" ADD CONSTRAINT "submission_events_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "citations_document_id_idx" ON "citations" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "citations_paper_id_idx" ON "citations" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "citations_doi_idx" ON "citations" USING btree ("doi");--> statement-breakpoint
CREATE INDEX "citations_key_idx" ON "citations" USING btree ("citation_key");--> statement-breakpoint
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_paper_id_idx" ON "documents" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_comments_thread_id_idx" ON "review_comments" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "review_comments_status_idx" ON "review_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_threads_submission_id_idx" ON "review_threads" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_events_submission_id_idx" ON "submission_events" USING btree ("submission_id");--> statement-breakpoint
ALTER TABLE "data_files" ADD CONSTRAINT "data_files_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figures" ADD CONSTRAINT "figures_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_charts" ADD CONSTRAINT "generated_charts_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_stages" ADD CONSTRAINT "paper_stages_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_versions" ADD CONSTRAINT "paper_versions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_runs" ADD CONSTRAINT "sandbox_runs_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "data_files_paper_id_idx" ON "data_files" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "journal_connections_user_id_idx" ON "journal_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "paper_stages_paper_id_idx" ON "paper_stages" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "paper_stages_stage_idx" ON "paper_stages" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "paper_versions_paper_id_idx" ON "paper_versions" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "papers_user_id_idx" ON "papers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "papers_status_idx" ON "papers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "references_paper_id_idx" ON "references" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "submissions_paper_id_idx" ON "submissions" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "submissions_user_id_idx" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("submission_status");