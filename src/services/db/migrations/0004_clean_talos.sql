ALTER TYPE "public"."journal_platform" ADD VALUE 'email';--> statement-breakpoint
ALTER TYPE "public"."journal_platform" ADD VALUE 'editorial_manager';--> statement-breakpoint
CREATE TABLE "ai_system_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"journal_id" integer,
	"source_type" text NOT NULL,
	"source_id" text,
	"rule_text" text,
	"category" text,
	"product_insight" text,
	"is_actionable" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_abstract_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_id" integer NOT NULL,
	"abstract_type" text NOT NULL,
	"default_word_limit" integer,
	"label" text DEFAULT 'Abstract',
	"allow_citations" boolean DEFAULT false,
	"structured_headings" jsonb,
	"additional_requirements" jsonb,
	"notes" text,
	CONSTRAINT "journal_abstract_rules_journal_id_unique" UNIQUE("journal_id")
);
--> statement-breakpoint
CREATE TABLE "journal_article_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_id" integer NOT NULL,
	"type_name" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"word_limit" integer,
	"word_limit_notes" text,
	"display_items_limit" integer,
	"references_limit" integer,
	"methods_word_limit" integer,
	"abstract_word_limit" integer,
	"supplementary_notes" text
);
--> statement-breakpoint
CREATE TABLE "journal_citation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_id" integer NOT NULL,
	"style_name" text NOT NULL,
	"in_text_format" text NOT NULL,
	"reference_list_order" text NOT NULL,
	"et_al_threshold" integer,
	"et_al_display_count" integer,
	"volume_format" text,
	"year_format" text,
	"journal_title_format" text,
	"author_format" text,
	"last_author_separator" text,
	"article_title_format" text,
	"personal_comms_in_ref_list" boolean DEFAULT false,
	"example_reference" text,
	"notes" text,
	CONSTRAINT "journal_citation_rules_journal_id_unique" UNIQUE("journal_id")
);
--> statement-breakpoint
CREATE TABLE "journal_cover_letter_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_id" integer NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"max_pages" integer DEFAULT 1,
	"shown_to_reviewers" boolean DEFAULT false,
	"required_content" jsonb,
	"unique_requirements" text,
	"tone_guidance" text,
	"template_prompt" text,
	"notes" text,
	CONSTRAINT "journal_cover_letter_rules_journal_id_unique" UNIQUE("journal_id")
);
--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "required_sections" jsonb;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "data_source" text DEFAULT 'ai-generated';--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "last_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "ai_system_feedback" ADD CONSTRAINT "ai_system_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_system_feedback" ADD CONSTRAINT "ai_system_feedback_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_abstract_rules" ADD CONSTRAINT "journal_abstract_rules_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_article_types" ADD CONSTRAINT "journal_article_types_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_citation_rules" ADD CONSTRAINT "journal_citation_rules_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_cover_letter_rules" ADD CONSTRAINT "journal_cover_letter_rules_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_article_types_journal_id_idx" ON "journal_article_types" USING btree ("journal_id");