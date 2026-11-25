import { z } from "zod";

import { challengeDifficulties, challengeTypes, experienceLevels } from "@/lib/constants";
import { challengeLanguages } from "@/features/challenges/schemas";

const blankToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), schema.optional());

export const talentFiltersSchema = z.object({
  q: blankToUndefined(z.string().trim().max(120)),
  skill: blankToUndefined(z.string().trim().max(40)),
  min: blankToUndefined(z.coerce.number().int().min(0).max(100)),
  level: blankToUndefined(z.enum(experienceLevels)),
  location: blankToUndefined(z.string().trim().max(80)),
  page: blankToUndefined(z.coerce.number().int().min(1)),
});
export type TalentFilters = z.infer<typeof talentFiltersSchema>;

export const inviteSchema = z
  .object({
    jobId: z.uuid("Pick a role"),
    salaryMinLakhs: z.coerce.number().min(1, "Add a salary range").max(1000),
    salaryMaxLakhs: z.coerce.number().min(1, "Add a salary range").max(1000),
    message: z
      .string()
      .trim()
      .min(40, "Say why they are a match, in at least 40 characters")
      .max(1200, "Keep it under 1200 characters"),
  })
  .refine((v) => v.salaryMaxLakhs >= v.salaryMinLakhs, {
    message: "Maximum must be at least the minimum",
    path: ["salaryMaxLakhs"],
  });

export const declineReasons = [
  "Salary is below what I am looking for",
  "Not the right kind of role",
  "Not looking right now",
  "Prefer a different location or remote setup",
  "Other",
] as const;

export const respondSchema = z.object({
  inviteId: z.uuid(),
  decision: z.enum(["accept", "decline"]),
  declineReason: blankToUndefined(z.enum(declineReasons)),
});

export const briefSchema = z.object({
  title: z.string().trim().min(4, "Give it a title").max(100),
  skill: z.string().trim().min(1, "Which skill does it test?").max(40),
  type: z.enum(challengeTypes, "Pick a type"),
  difficulty: z.enum(challengeDifficulties, "Pick a difficulty"),
  timeLimitMinutes: z.coerce.number().int().min(10).max(90),
  language: blankToUndefined(z.enum(challengeLanguages)),
  description: z
    .string()
    .trim()
    .min(80, "Describe the problem in at least 80 characters")
    .max(4000),
  starterCode: blankToUndefined(z.string().max(4000)),
  rubric: z
    .array(z.string().trim().min(3).max(200))
    .min(2, "Add at least two rubric lines")
    .max(6, "Keep it to six rubric lines"),
});
