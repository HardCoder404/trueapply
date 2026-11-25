CREATE TYPE "public"."submission_status" AS ENUM('started', 'submitted', 'evaluated', 'failed');--> statement-breakpoint
DROP INDEX "submissions_challenge_id_idx";--> statement-breakpoint
DROP INDEX "skill_scores_user_skill_idx";--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "skill" text NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "starter_code" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "rubric" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "position" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "status" "submission_status" DEFAULT 'started' NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "run_output" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "started_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "handle" text;--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_challenge_user_idx" ON "submissions" USING btree ("challenge_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_idx" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_scores_user_skill_idx" ON "skill_scores" USING btree ("user_id","skill");
UPDATE "users" SET "handle" = lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left("id"::text, 6) WHERE "handle" IS NULL;
