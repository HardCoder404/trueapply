import type { applications, companies, jobs } from "@/db/schema";

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type JobWithCompany = Job & { company: Company };

export type RealityVerdict = "verified" | "likely-real" | "suspicious";
