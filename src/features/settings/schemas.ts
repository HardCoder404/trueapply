import { z } from "zod";

import { companySizes, experienceLevels, industries } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length ? value : null));

const name = z.string().trim().min(2, "Tell us your name").max(80);

export const seekerSettingsSchema = z.object({
  name,
  headline: optionalText(120),
  bio: optionalText(600),
  skills: z.array(z.string().trim().min(1).max(40)).max(20, "Keep it to 20 skills"),
  location: optionalText(80),
  experienceLevel: z.enum(experienceLevels, "Pick your experience level"),
});

export const recruiterSettingsSchema = z.object({
  name,
  companyName: z.string().trim().min(2, "Company name is required").max(120),
  companySize: z.enum(companySizes, "Pick a company size"),
  industry: z.enum(industries, "Pick an industry"),
});
