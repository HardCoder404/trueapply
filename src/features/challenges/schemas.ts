import { z } from "zod";

import { challengeDifficulties, challengeTypes } from "@/lib/constants";

export const challengeLanguages = ["javascript", "typescript", "python"] as const;
export type ChallengeLanguage = (typeof challengeLanguages)[number];

export const generatedChallenges = z.object({
  challenges: z
    .array(
      z.object({
        title: z.string().min(4).max(100),
        skill: z.string().min(1).max(40),
        type: z.enum(challengeTypes),
        difficulty: z.enum(challengeDifficulties),
        time_limit_minutes: z.number().int().min(10).max(60),
        language: z.enum(challengeLanguages).nullable(),
        brief: z.string().min(80).max(4000),
        starter_code: z.string().max(4000).nullable(),
        rubric: z.array(z.string().min(3).max(200)).min(2).max(6),
      }),
    )
    .min(2)
    .max(3),
});

export const evaluation = z.object({
  correctness: z.number().int().min(0).max(40),
  quality: z.number().int().min(0).max(25),
  edge_cases: z.number().int().min(0).max(20),
  readability: z.number().int().min(0).max(15),
  feedback: z.string().min(20).max(900),
  strengths: z.array(z.string().max(160)).max(4),
  gaps: z.array(z.string().max(160)).max(4),
});

export const submissionSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(20, "That is too short to grade. Write out your solution.")
    .max(20000, "Keep it under 20,000 characters"),
  runOutput: z.string().max(4000).optional(),
});
