ALTER TABLE "jobs" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "reality_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "jobs_reality_score_idx" ON "jobs" USING btree ("reality_score");