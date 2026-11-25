import type { applications, jobs } from "@/db/schema";
import type { Company } from "@/features/auth/types";

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type JobWithCompany = Job & { company: Company };

export type RealityVerdict = "verified" | "likely-real" | "suspicious";
