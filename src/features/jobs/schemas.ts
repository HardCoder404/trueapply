import { z } from "zod";

import { daysBetween } from "@/lib/format";

const lakhs = z.coerce
  .number({ message: "Enter a number in lakhs" })
  .positive("Must be above zero")
  .max(1000, "That is more than ₹10 crore, check the number");

export const jobSchema = z
  .object({
    title: z.string().trim().min(4, "Title is too short").max(100),
    description: z
      .string()
      .trim()
      .min(120, "Candidates need at least a paragraph. Aim for 120+ characters.")
      .max(8000, "Keep it under 8000 characters"),
    salaryMinLakhs: lakhs,
    salaryMaxLakhs: lakhs,
    location: z.string().trim().min(2, "Add a city or region").max(80),
    remote: z.boolean(),
    skills: z
      .array(z.string().trim().min(1).max(40))
      .min(1, "Add at least one skill")
      .max(15, "Keep it to 15 skills"),
    deadline: z.coerce
      .date({ message: "Pick a deadline" })
      .refine(
        (date) => daysBetween(new Date(), date) >= 1,
        "Deadline must be at least a day away",
      )
      .refine(
        (date) => daysBetween(new Date(), date) <= 180,
        "Deadlines beyond six months look like evergreen postings",
      ),
  })
  .refine((job) => job.salaryMaxLakhs >= job.salaryMinLakhs, {
    path: ["salaryMaxLakhs"],
    message: "Maximum must be at least the minimum",
  });

export type JobInput = z.infer<typeof jobSchema>;

export const jobFiltersSchema = z.object({
  q: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  remote: z.literal("1").optional(),
  min: z.coerce.number().min(0).max(1000).optional(),
  skill: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type JobFilters = z.infer<typeof jobFiltersSchema>;
