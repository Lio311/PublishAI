CREATE TYPE "public"."debate_status" AS ENUM('pending', 'in_progress', 'consensus_reached', 'failed');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('drug', 'protein', 'gene', 'disease', 'concept', 'study', 'method');--> statement-breakpoint
CREATE TYPE "public"."feedback_outcome" AS ENUM('accepted', 'rejected', 'revision_required');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('affects', 'contradicts', 'supports', 'causes', 'treats', 'correlates');--> statement-breakpoint
CREATE TYPE "public"."sandbox_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "ab_test_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" integer NOT NULL,
	"prompt_strategy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" integer NOT NULL,
	"filename" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "debate_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"name" text NOT NULL,
	"persona" text NOT NULL,
	"system_prompt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debate_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"agent_id" uuid,
	"content" text NOT NULL,
	"round" integer NOT NULL,
	"is_consensus_proposal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "debates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" integer NOT NULL,
	"status" "debate_status" DEFAULT 'pending',
	"topic" text NOT NULL,
	"consensus_summary" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "figure_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"figure_id" uuid NOT NULL,
	"model_used" text NOT NULL,
	"legend_accuracy_score" integer,
	"claim_verification_status" text,
	"suggested_legend" text,
	"issues_found" jsonb,
	"raw_analysis" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "figures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" integer NOT NULL,
	"paper_version_id" integer NOT NULL,
	"figure_number" integer NOT NULL,
	"image_url" text NOT NULL,
	"original_legend" text,
	"extracted_text" text,
	"resolution" integer,
	"quality_score" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_charts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandbox_run_id" uuid NOT NULL,
	"paper_id" integer NOT NULL,
	"chart_url" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prompt_template" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rlhf_feedback_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" integer NOT NULL,
	"paper_version_id" integer NOT NULL,
	"journal_id" integer NOT NULL,
	"outcome" "feedback_outcome" NOT NULL,
	"reviewer_comments" text,
	"correction_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sandbox_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" integer NOT NULL,
	"status" "sandbox_status" DEFAULT 'pending',
	"python_script" text,
	"execution_logs" text,
	"analysis_results" jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scientific_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "entity_type" NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "scientific_entities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scientific_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"evidence_text" text NOT NULL,
	"paper_id" integer,
	"confidence_score" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "paper_versions" ADD COLUMN "reviewer_comments" text;--> statement-breakpoint
ALTER TABLE "paper_versions" ADD COLUMN "rebuttal_strategy" text;--> statement-breakpoint
ALTER TABLE "ab_test_allocations" ADD CONSTRAINT "ab_test_allocations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_allocations" ADD CONSTRAINT "ab_test_allocations_prompt_strategy_id_prompt_strategies_id_fk" FOREIGN KEY ("prompt_strategy_id") REFERENCES "public"."prompt_strategies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_files" ADD CONSTRAINT "data_files_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_agents" ADD CONSTRAINT "debate_agents_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_agent_id_debate_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."debate_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figure_analyses" ADD CONSTRAINT "figure_analyses_figure_id_figures_id_fk" FOREIGN KEY ("figure_id") REFERENCES "public"."figures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figures" ADD CONSTRAINT "figures_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figures" ADD CONSTRAINT "figures_paper_version_id_paper_versions_id_fk" FOREIGN KEY ("paper_version_id") REFERENCES "public"."paper_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_charts" ADD CONSTRAINT "generated_charts_sandbox_run_id_sandbox_runs_id_fk" FOREIGN KEY ("sandbox_run_id") REFERENCES "public"."sandbox_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_charts" ADD CONSTRAINT "generated_charts_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rlhf_feedback_logs" ADD CONSTRAINT "rlhf_feedback_logs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rlhf_feedback_logs" ADD CONSTRAINT "rlhf_feedback_logs_paper_version_id_paper_versions_id_fk" FOREIGN KEY ("paper_version_id") REFERENCES "public"."paper_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rlhf_feedback_logs" ADD CONSTRAINT "rlhf_feedback_logs_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_runs" ADD CONSTRAINT "sandbox_runs_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scientific_relationships" ADD CONSTRAINT "scientific_relationships_source_entity_id_scientific_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."scientific_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scientific_relationships" ADD CONSTRAINT "scientific_relationships_target_entity_id_scientific_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."scientific_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scientific_relationships" ADD CONSTRAINT "scientific_relationships_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE set null ON UPDATE no action;