import { z } from "zod";

import { companySizes, experienceLevels, industries } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length ? value : null));

const name = z.string().trim().min(2, "Tell us your name").max(80);

const domain = z
  .string()
  .trim()
  .toLowerCase()
  .transform(
    (value) =>
      value
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0],
  )
  .pipe(z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Enter a domain like acme.com"));

export const seekerOnboardingSchema = z.object({
  role: z.literal("seeker"),
  name,
  headline: optionalText(120),
  bio: optionalText(600),
  skills: z.array(z.string().trim().min(1).max(40)).max(20, "Keep it to 20 skills"),
  location: optionalText(80),
  experienceLevel: z.enum(experienceLevels, "Pick your experience level"),
});

export const recruiterOnboardingSchema = z.object({
  role: z.literal("recruiter"),
  name,
  companyName: z.string().trim().min(2, "Company name is required").max(120),
  companyDomain: domain,
  companySize: z.enum(companySizes, "Pick a company size"),
  industry: z.enum(industries, "Pick an industry"),
});

export const onboardingSchema = z.discriminatedUnion("role", [
  seekerOnboardingSchema,
  recruiterOnboardingSchema,
]);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
