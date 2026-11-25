import { z } from "zod";

import { applicationStages, experienceLevels } from "@/lib/constants";

export const nextStages = applicationStages.filter((stage) => stage !== "applied");

const reason = z
  .string()
  .trim()
  .min(8, "Write at least a short sentence. Candidates read this.")
  .max(400, "Keep it under 400 characters");

export const applySchema = z.object({
  note: z
    .string()
    .trim()
    .max(300, "Keep it under 300 characters")
    .transform((value) => (value.length ? value : null)),
});

export const stageChangeSchema = z.object({
  applicationId: z.uuid(),
  stage: z.enum(nextStages, "Pick a stage"),
  reason,
});

export const bulkStageSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, "Select at least one applicant")
    .max(50, "Up to 50 at a time"),
  stage: z.enum(nextStages, "Pick a stage"),
  reason,
});

export const applicantFiltersSchema = z.object({
  min: z.coerce.number().int().min(0).max(100).optional(),
  skill: z.string().trim().max(40).optional(),
  level: z.enum(experienceLevels).optional(),
  stage: z.enum(applicationStages).optional(),
});

export type ApplicantFilters = z.infer<typeof applicantFiltersSchema>;
