ALTER TABLE "challenges" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "integrity" jsonb;