import "server-only";

import { and, cosineDistance, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import {
  candidateMatches,
  challenges,
  jobEmbeddings,
  seekerEmbeddings,
  seekerProfiles,
  skillScores,
  submissions,
  users,
} from "@/db/schema";
import { jobDocument } from "@/features/coach/index-jobs";
import { embedOne } from "@/lib/ai/embeddings";
import { completeJson, GroqUnavailableError } from "@/lib/ai/groq";
import {
  experienceLevelLabels,
  experienceLevels,
  type ExperienceLevel,
} from "@/lib/constants";
import { formatSalaryRange } from "@/lib/format";

import { candidateLabel } from "./anonymous";

const poolSize = 40;
const keep = 12;
const explain = 8;

export const matchWeights = {
  skillMatch: 0.5,
  performance: 0.3,
  trajectory: 0.2,
} as const;

type JobForMatching = {
  id: string;
  title: string;
  description: string;
  location: string;
  remote: boolean;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  company: { name: string; industry: string | null };
};

export function inferLevel(title: string): ExperienceLevel | null {
  const t = title.toLowerCase();
  if (/\b(lead|head|principal|staff|director|architect|vp)\b/.test(t)) return "lead";
  if (/\b(senior|sr\.?|iii)\b/.test(t)) return "senior";
  if (/\b(intern|trainee|apprentice)\b/.test(t)) return "intern";
  if (/\b(junior|jr\.?|associate|graduate|fresher|entry[- ]level|i)\b/.test(t))
    return "junior";
  return null;
}

function levelFit(target: ExperienceLevel | null, actual: ExperienceLevel | null) {
  if (!target || !actual) return 70;
  const gap = Math.abs(
    experienceLevels.indexOf(target) - experienceLevels.indexOf(actual),
  );
  return [100, 70, 35, 10, 0][gap] ?? 0;
}

const stopWords = new Set([
  "engineer",
  "developer",
  "role",
  "roles",
  "and",
  "or",
  "the",
  "a",
]);

function roleFit(preferred: string[], title: string) {
  if (!preferred.length) return 50;
  const words = (s: string) =>
    s
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));
  const titleWords = new Set(words(title));
  const hit = preferred.some((role) => words(role).some((w) => titleWords.has(w)));
  return hit ? 100 : 0;
}

export type Factors = {
  skillMatch: number;
  performance: number;
  trajectory: number;
  score: number;
};

export function scoreCandidate(input: {
  jobSkills: string[];
  jobTitle: string;
  verified: Map<string, number>;
  claimed: Set<string>;
  roleScore: number | null;
  overallScore: number | null;
  similarity: number | null;
  level: ExperienceLevel | null;
  preferredRoles: string[];
}): Factors {
  const skills = input.jobSkills.map((s) => s.toLowerCase());
  const credit = skills.map((skill) => {
    const verified = input.verified.get(skill);
    if (verified != null) return verified / 100;
    return input.claimed.has(skill) ? 0.4 : 0;
  });
  const skillMatch = skills.length
    ? Math.round((credit.reduce((a, b) => a + b, 0) / skills.length) * 100)
    : 0;

  const performance = Math.round(input.roleScore ?? input.overallScore ?? 0);

  const sim = input.similarity ?? 0.5;
  const simScore = Math.max(0, Math.min(1, (sim - 0.3) / 0.5)) * 100;
  const trajectory = Math.round(
    0.4 * simScore +
      0.4 * levelFit(inferLevel(input.jobTitle), input.level) +
      0.2 * roleFit(input.preferredRoles, input.jobTitle),
  );

  const score = Math.round(
    matchWeights.skillMatch * skillMatch +
      matchWeights.performance * performance +
      matchWeights.trajectory * trajectory,
  );
  return { skillMatch, performance, trajectory, score };
}

const assessmentSchema = z.object({
  assessments: z.array(z.object({ id: z.string(), fit: z.string().min(10).max(500) })),
});

async function explainMatches(
  job: JobForMatching,
  candidates: Array<{
    id: string;
    label: string;
    factors: Factors;
    level: ExperienceLevel | null;
    preferredRoles: string[];
    verified: Array<{ skill: string; score: number }>;
    claimed: string[];
    roleScore: number | null;
  }>,
) {
  const lines = candidates.map((c, i) =>
    [
      `C${i + 1} (${c.label}):`,
      `  experience ${c.level ? experienceLevelLabels[c.level] : "unknown"}; wants ${c.preferredRoles.join(", ") || "unspecified roles"}`,
      `  verified: ${c.verified.map((v) => `${v.skill} ${v.score}/100`).join(", ") || "none"}`,
      `  claimed only: ${c.claimed.join(", ") || "none"}`,
      `  this role's challenge score: ${c.roleScore ?? "not attempted"}`,
      `  factors: skill match ${c.factors.skillMatch}, performance ${c.factors.performance}, trajectory ${c.factors.trajectory}`,
    ].join("\n"),
  );
  const result = await completeJson({
    system: `You are a hiring analyst. For each candidate, write 2 or 3 plain sentences (max 60 words) on how well their proven abilities fit the role: what is verified and strong, what is only claimed or missing, and whether their level and direction fit. Cite the numbers given. No greetings, no hedging, no names. Return JSON {"assessments":[{"id":"C1","fit":"..."}]}.`,
    user: `Role: ${job.title} at ${job.company.name}${job.company.industry ? ` (${job.company.industry})` : ""}\nLocation: ${job.location}${job.remote ? ", remote friendly" : ""}; pay ${formatSalaryRange(job.salaryMin, job.salaryMax)}\nRequired skills: ${job.skills.join(", ")}\nDescription: ${job.description.slice(0, 1200)}\n\nCandidates:\n${lines.join("\n")}`,
    schema: assessmentSchema,
    maxTokens: 1400,
  });
  const byId = new Map(result.assessments.map((a) => [a.id.toUpperCase(), a.fit.trim()]));
  return candidates.map((_, i) => byId.get(`C${i + 1}`) ?? null);
}

export async function rankCandidatesForJob(job: JobForMatching) {
  const db = getDb();

  const stored = await db.query.jobEmbeddings.findFirst({
    where: eq(jobEmbeddings.jobId, job.id),
    columns: { embedding: true },
  });
  const vector =
    stored?.embedding ??
    (await embedOne(
      jobDocument({
        ...job,
        companyName: job.company.name,
        industry: job.company.industry,
      }),
    ));
  const similarity = sql<
    number | null
  >`1 - (${cosineDistance(seekerEmbeddings.embedding, vector)})`;

  const pool = await db
    .select({
      id: users.id,
      level: seekerProfiles.experienceLevel,
      preferredRoles: seekerProfiles.preferredRoles,
      claimed: seekerProfiles.skills,
      similarity,
    })
    .from(users)
    .innerJoin(seekerProfiles, eq(seekerProfiles.userId, users.id))
    .leftJoin(seekerEmbeddings, eq(seekerEmbeddings.userId, users.id))
    .where(
      and(
        eq(users.role, "seeker"),
        eq(seekerProfiles.discoverable, true),
        sql`exists (select 1 from skill_scores ss where ss.user_id = ${users.id})`,
        sql`not exists (select 1 from applications a where a.user_id = ${users.id} and a.job_id = ${job.id})`,
      ),
    )
    .orderBy(sql`${similarity} desc nulls last`)
    .limit(poolSize);

  await db.delete(candidateMatches).where(eq(candidateMatches.jobId, job.id));
  if (!pool.length) return { ranked: 0, explained: 0 };

  const ids = pool.map((p) => p.id);
  const [verifiedRows, roleRows] = await Promise.all([
    db.query.skillScores.findMany({ where: inArray(skillScores.userId, ids) }),
    db
      .select({
        userId: submissions.userId,
        avg: sql<number>`avg(${submissions.score})::int`,
      })
      .from(submissions)
      .innerJoin(challenges, eq(submissions.challengeId, challenges.id))
      .where(
        and(
          eq(challenges.jobId, job.id),
          eq(submissions.status, "evaluated"),
          inArray(submissions.userId, ids),
        ),
      )
      .groupBy(submissions.userId),
  ]);

  const verifiedBy = new Map<string, Array<{ skill: string; score: number }>>();
  for (const row of verifiedRows) {
    verifiedBy.set(row.userId, [
      ...(verifiedBy.get(row.userId) ?? []),
      { skill: row.skill, score: row.score },
    ]);
  }
  const roleScoreBy = new Map(roleRows.map((r) => [r.userId, Number(r.avg)]));

  const scored = pool
    .map((candidate) => {
      const verified = verifiedBy.get(candidate.id) ?? [];
      const overall = verified.length
        ? verified.reduce((sum, v) => sum + v.score, 0) / verified.length
        : null;
      const factors = scoreCandidate({
        jobSkills: job.skills,
        jobTitle: job.title,
        verified: new Map(verified.map((v) => [v.skill.toLowerCase(), v.score])),
        claimed: new Set(candidate.claimed.map((s) => s.toLowerCase())),
        roleScore: roleScoreBy.get(candidate.id) ?? null,
        overallScore: overall,
        similarity: candidate.similarity == null ? null : Number(candidate.similarity),
        level: candidate.level,
        preferredRoles: candidate.preferredRoles,
      });
      return {
        id: candidate.id,
        label: candidateLabel(candidate.id),
        level: candidate.level,
        preferredRoles: candidate.preferredRoles,
        verified: [...verified].sort((a, b) => b.score - a.score),
        claimed: candidate.claimed.filter(
          (s) => !verified.some((v) => v.skill.toLowerCase() === s.toLowerCase()),
        ),
        roleScore: roleScoreBy.get(candidate.id) ?? null,
        factors,
      };
    })
    .sort((a, b) => b.factors.score - a.factors.score)
    .slice(0, keep);

  let reasons: Array<string | null> = scored.map(() => null);
  try {
    const explained = await explainMatches(job, scored.slice(0, explain));
    reasons = scored.map((_, i) => explained[i] ?? null);
  } catch (error) {
    if (!(error instanceof GroqUnavailableError || error instanceof SyntaxError))
      throw error;
    console.error("Match reasoning unavailable", error);
  }

  await db.insert(candidateMatches).values(
    scored.map((c, i) => ({
      jobId: job.id,
      userId: c.id,
      score: c.factors.score,
      skillMatch: c.factors.skillMatch,
      performance: c.factors.performance,
      trajectory: c.factors.trajectory,
      reasoning: reasons[i],
    })),
  );

  return { ranked: scored.length, explained: reasons.filter(Boolean).length };
}
