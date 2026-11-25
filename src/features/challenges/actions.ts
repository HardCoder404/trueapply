"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { challenges, skillScores, submissions } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/queries";
import { syncSeekerIndex } from "@/features/talent/index-seekers";
import { getCompanyJob } from "@/features/jobs/queries";
import { GroqUnavailableError } from "@/lib/ai/groq";

import { evaluateSubmission } from "./evaluator";
import { generateChallenges } from "./generator";
import { countJobSubmissions, getChallenge, getSubmission } from "./queries";
import { integritySchema, submissionSchema } from "./schemas";

export type SubmissionState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
} | null;

const graceMs = 60_000;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseIntegrity(raw: string) {
  try {
    const parsed = integritySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function seekerAccount() {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  return account?.role === "seeker" ? account : null;
}

export async function createChallengesForJob(job: {
  id: string;
  title: string;
  description: string;
  skills: string[];
}) {
  const generated = await generateChallenges(job);
  await getDb()
    .insert(challenges)
    .values(generated.map((challenge) => ({ ...challenge, jobId: job.id })));
  return generated.length;
}

export async function regenerateChallenges(formData: FormData) {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  const company = account?.role === "recruiter" ? account.company : null;
  const job = company ? await getCompanyJob(text(formData, "jobId"), company.id) : null;
  if (!job || job.status === "archived") return;

  const db = getDb();
  if ((await countJobSubmissions(job.id)) > 0) {
    await db
      .update(challenges)
      .set({ active: false })
      .where(and(eq(challenges.jobId, job.id), eq(challenges.custom, false)));
  } else {
    await db
      .delete(challenges)
      .where(and(eq(challenges.jobId, job.id), eq(challenges.custom, false)));
  }
  await createChallengesForJob(job);

  revalidatePath(`/recruiter/jobs/${job.id}`);
  revalidatePath(`/jobs/${job.slug}/challenges`);
  redirect(`/recruiter/jobs/${job.id}`);
}

export async function startChallenge(formData: FormData) {
  const account = await seekerAccount();
  const challenge = await getChallenge(text(formData, "challengeId"));
  if (!account || !challenge || !challenge.active || challenge.job.status !== "open")
    return;

  const existing = await getSubmission(challenge.id, account.id);
  if (!existing) {
    await getDb()
      .insert(submissions)
      .values({ challengeId: challenge.id, userId: account.id });
  }

  redirect(`/challenges/${challenge.id}`);
}

async function recordSkillScore(
  userId: string,
  skill: string,
  score: number,
  challengeId: string,
) {
  await getDb()
    .insert(skillScores)
    .values({ userId, skill, score, challengeId })
    .onConflictDoUpdate({
      target: [skillScores.userId, skillScores.skill],
      set: {
        score: sql`greatest(${skillScores.score}, excluded.score)`,
        challengeId: sql`case when excluded.score >= ${skillScores.score} then excluded.challenge_id else ${skillScores.challengeId} end`,
        verifiedAt: sql`now()`,
      },
    });
  await syncSeekerIndex(userId);
}

async function gradeAndStore(
  submissionId: string,
  challenge: NonNullable<Awaited<ReturnType<typeof getChallenge>>>,
  userId: string,
  answer: string,
  runOutput: string | null,
) {
  const db = getDb();
  try {
    const result = await evaluateSubmission({ challenge, answer, runOutput });
    await db
      .update(submissions)
      .set({
        status: "evaluated",
        score: result.score,
        feedback: result.feedback,
        breakdown: result.breakdown,
      })
      .where(eq(submissions.id, submissionId));
    await recordSkillScore(userId, challenge.skill, result.score, challenge.id);
    return true;
  } catch (error) {
    if (!(error instanceof GroqUnavailableError || error instanceof SyntaxError))
      throw error;
    await db
      .update(submissions)
      .set({ status: "failed" })
      .where(eq(submissions.id, submissionId));
    return false;
  }
}

export async function submitChallenge(
  _previous: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const account = await seekerAccount();
  const challenge = await getChallenge(text(formData, "challengeId"));
  if (!account || !challenge) return { message: "Sign in as a job seeker to submit." };

  const submission = await getSubmission(challenge.id, account.id);
  if (!submission || submission.status !== "started") {
    return { message: "This challenge has already been submitted." };
  }

  const parsed = submissionSchema.safeParse({
    answer: text(formData, "answer"),
    runOutput: text(formData, "runOutput") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const deadline =
    submission.startedAt.getTime() + challenge.timeLimitMinutes * 60_000 + graceMs;
  if (Date.now() > deadline) {
    await getDb()
      .update(submissions)
      .set({ status: "failed" })
      .where(eq(submissions.id, submission.id));
    return { message: "Time is up for this challenge. The attempt has been closed." };
  }

  const runOutput = parsed.data.runOutput ?? null;
  await getDb()
    .update(submissions)
    .set({
      status: "submitted",
      code: parsed.data.answer,
      runOutput,
      integrity: parseIntegrity(text(formData, "integrity")),
      submittedAt: new Date(),
    })
    .where(eq(submissions.id, submission.id));

  await gradeAndStore(
    submission.id,
    challenge,
    account.id,
    parsed.data.answer,
    runOutput,
  );

  revalidatePath("/seeker/dashboard");
  redirect(`/challenges/${challenge.id}/result`);
}

export async function retryEvaluation(formData: FormData) {
  const account = await seekerAccount();
  const challenge = await getChallenge(text(formData, "challengeId"));
  if (!account || !challenge) return;

  const submission = await getSubmission(challenge.id, account.id);
  if (
    !submission?.code ||
    (submission.status !== "failed" && submission.status !== "submitted")
  )
    return;

  await gradeAndStore(
    submission.id,
    challenge,
    account.id,
    submission.code,
    submission.runOutput,
  );
  revalidatePath("/seeker/dashboard");
  redirect(`/challenges/${challenge.id}/result`);
}

export async function abandonChallenge(formData: FormData) {
  const account = await seekerAccount();
  if (!account) return;
  await getDb()
    .update(submissions)
    .set({ status: "failed" })
    .where(
      and(
        eq(submissions.challengeId, text(formData, "challengeId")),
        eq(submissions.userId, account.id),
        eq(submissions.status, "started"),
      ),
    );
  redirect("/seeker/dashboard");
}
