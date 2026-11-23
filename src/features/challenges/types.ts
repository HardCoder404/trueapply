import type { challenges, skillScores, submissions } from "@/db/schema";

export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

export type SkillScore = typeof skillScores.$inferSelect;
export type NewSkillScore = typeof skillScores.$inferInsert;

export type SubmissionWithChallenge = Submission & { challenge: Challenge };
