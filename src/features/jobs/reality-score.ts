import { z } from "zod";

import type { RealitySignal } from "@/db/schema";
import { completeJson, GroqUnavailableError } from "@/lib/ai/groq";
import { realityThresholds } from "@/lib/constants";
import { daysBetween } from "@/lib/format";

import type { RealityVerdict } from "./types";

export const verdictLabels: Record<RealityVerdict, string> = {
  verified: "Verified",
  "likely-real": "Likely real",
  suspicious: "Suspicious",
};

export function verdictFor(score: number | null | undefined): RealityVerdict | null {
  if (score == null) return null;
  if (score >= realityThresholds.verified) return "verified";
  if (score >= realityThresholds.likelyReal) return "likely-real";
  return "suspicious";
}

export type CompanyHistory = {
  verified: boolean;
  completedHires: number;
  responseRate: number | null;
  slowResponder: boolean;
};

type JobDraft = {
  title: string;
  description: string;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  deadline: Date;
};

const assessment = z.object({
  specificity: z.number().min(0).max(20),
  summary: z.string().max(400),
  red_flags: z.array(z.string().max(160)).max(5),
});

const assessmentPrompt = `You audit job postings for a hiring platform that flags ghost jobs.
Score how SPECIFIC and REAL the posting reads, from 0 to 20.

Give high scores for: concrete responsibilities, a named tech stack or tools, team or product context, what success looks like, an outline of the interview process, honest constraints.
Give low scores for: recycled boilerplate, buzzword lists with no substance, "always hiring" or "pipeline" language, responsibilities that could describe any company, mismatches between title and content.

Respond with JSON only: {"specificity": <0-20 integer>, "summary": "<one sentence a candidate would find useful>", "red_flags": ["<short phrase>", ...]}`;

function heuristicAssessment(job: JobDraft): RealitySignal {
  const words = job.description.split(/\s+/).length;
  const mentionsStack = job.skills.some((skill) =>
    job.description.toLowerCase().includes(skill.toLowerCase()),
  );
  const points = Math.min(12, Math.round(words / 40) + (mentionsStack ? 4 : 0));
  return {
    key: "description",
    label: "Description is specific",
    points,
    max: 20,
    detail:
      "Automatic review was unavailable, so this is scored on length and stack mentions only.",
  };
}

async function assessDescription(job: JobDraft): Promise<RealitySignal> {
  try {
    const result = await completeJson({
      system: assessmentPrompt,
      user: `Title: ${job.title}\nSkills: ${job.skills.join(", ")}\n\n${job.description}`,
      schema: assessment,
    });
    const flags = result.red_flags.length
      ? ` Flags: ${result.red_flags.join("; ")}.`
      : "";
    return {
      key: "description",
      label: "Description is specific",
      points: Math.round(result.specificity),
      max: 20,
      detail: `${result.summary}${flags}`,
    };
  } catch (error) {
    if (error instanceof GroqUnavailableError || error instanceof SyntaxError) {
      return heuristicAssessment(job);
    }
    throw error;
  }
}

function salarySignal(job: JobDraft): RealitySignal {
  const spread = job.salaryMax / job.salaryMin;
  if (spread <= 2) {
    return {
      key: "salary",
      label: "Salary range disclosed",
      points: 20,
      max: 20,
      detail: "A tight, published range.",
    };
  }
  return {
    key: "salary",
    label: "Salary range disclosed",
    points: 10,
    max: 20,
    detail: "The range is very wide, which often means the budget is not settled.",
  };
}

function deadlineSignal(job: JobDraft): RealitySignal {
  const days = daysBetween(new Date(), job.deadline);
  const detail = `Closes in ${days} day${days === 1 ? "" : "s"}.`;
  if (days >= 7 && days <= 60)
    return { key: "deadline", label: "Realistic deadline", points: 10, max: 10, detail };
  if (days < 7) {
    return {
      key: "deadline",
      label: "Realistic deadline",
      points: 5,
      max: 10,
      detail: `${detail} Very short windows are usually pre-decided hires.`,
    };
  }
  return {
    key: "deadline",
    label: "Realistic deadline",
    points: 4,
    max: 10,
    detail: `${detail} Long windows look like evergreen pipeline posts.`,
  };
}

function companySignals(company: CompanyHistory): RealitySignal[] {
  const responseRate: RealitySignal =
    company.responseRate == null
      ? {
          key: "response-rate",
          label: "Company responds to applicants",
          points: 10,
          max: 20,
          detail: "No applicant history on TrueApply yet, so this starts at half credit.",
        }
      : {
          key: "response-rate",
          label: "Company responds to applicants",
          points: Math.max(
            0,
            Math.round(company.responseRate * 20) - (company.slowResponder ? 5 : 0),
          ),
          max: 20,
          detail: `${Math.round(company.responseRate * 100)}% of applicants heard back within a week.${
            company.slowResponder ? " Someone is currently waiting past a week." : ""
          }`,
        };

  return [
    {
      key: "domain",
      label: "Verified company domain",
      points: company.verified ? 15 : 0,
      max: 15,
      detail: company.verified
        ? "The recruiter signed up with a company email."
        : "The recruiter has not verified a company email yet.",
    },
    responseRate,
    {
      key: "hires",
      label: "Has hired through TrueApply",
      points: company.completedHires > 0 ? 15 : 0,
      max: 15,
      detail:
        company.completedHires > 0
          ? `${company.completedHires} completed hire${company.completedHires === 1 ? "" : "s"}.`
          : "No completed hires on the platform yet.",
    },
  ];
}

export async function scoreJob(job: JobDraft, company: CompanyHistory) {
  const breakdown = [
    salarySignal(job),
    ...companySignals(company),
    await assessDescription(job),
    deadlineSignal(job),
  ];
  const score = breakdown.reduce((sum, signal) => sum + signal.points, 0);
  return { score, breakdown };
}
