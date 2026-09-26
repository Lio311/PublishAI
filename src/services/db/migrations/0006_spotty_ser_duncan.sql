ALTER TYPE "public"."feedback_outcome" ADD VALUE 'with_editor' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'under_review' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'reviews_received' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'revision_requested' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'revised_submitted' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'accepted' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'in_proofs' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'published' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."feedback_outcome" ADD VALUE 'withdrawn' BEFORE 'revision_required';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'with_editor';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'under_review';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'reviews_received';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'revision_requested';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'revised_submitted';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'accepted';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'in_proofs';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'published';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "funding_declaration" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "ai_usage_declaration" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "deposit_in_archive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "key_findings" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "mesh_terms" jsonb;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "data_available_statement" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "conflict_of_interest_statement" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "duplicate_material_statement" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "acknowledgements" text;