CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "candidate_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	"skill_match" smallint NOT NULL,
	"performance" smallint NOT NULL,
	"trajectory" smallint NOT NULL,
	"reasoning" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"message" text NOT NULL,
	"salary_min" integer NOT NULL,
	"salary_max" integer NOT NULL,
	"match_score" smallint,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"decline_reason" text,
	"application_id" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seeker_embeddings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(384) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "seeker_profiles" ADD COLUMN "preferred_roles" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "seeker_profiles" ADD COLUMN "discoverable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_matches" ADD CONSTRAINT "candidate_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_matches" ADD CONSTRAINT "candidate_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeker_embeddings" ADD CONSTRAINT "seeker_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_matches_job_user_idx" ON "candidate_matches" USING btree ("job_id","user_id");--> statement-breakpoint
CREATE INDEX "candidate_matches_job_id_idx" ON "candidate_matches" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_job_user_idx" ON "invites" USING btree ("job_id","user_id");--> statement-breakpoint
CREATE INDEX "invites_user_id_idx" ON "invites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invites_company_id_idx" ON "invites" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "seeker_embeddings_embedding_idx" ON "seeker_embeddings" USING hnsw ("embedding" vector_cosine_ops);