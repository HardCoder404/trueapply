import { cache } from "react";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { challenges, skillScores, submissions, users } from "@/db/schema";

export async function listJobChallenges(jobId: string) {
  return getDb().query.challenges.findMany({
    where: eq(challenges.jobId, jobId),
    orderBy: [asc(challenges.position)],
  });
}

export const getChallenge = cache(async (id: string) => {
  const challenge = await getDb().query.challenges.findFirst({
    where: eq(challenges.id, id),
    with: { job: { with: { company: true } } },
  });
  return challenge ?? null;
});

export const getSubmission = cache(async (challengeId: string, userId: string) => {
  const submission = await getDb().query.submissions.findFirst({
    where: and(eq(submissions.challengeId, challengeId), eq(submissions.userId, userId)),
  });
  return submission ?? null;
});

export async function submissionsForJob(jobId: string, userId: string) {
  const jobChallenges = await listJobChallenges(jobId);
  if (!jobChallenges.length) return { challenges: jobChallenges, byChallenge: new Map() };

  const rows = await getDb().query.submissions.findMany({
    where: and(
      eq(submissions.userId, userId),
      inArray(
        submissions.challengeId,
        jobChallenges.map((c) => c.id),
      ),
    ),
  });

  return {
    challenges: jobChallenges,
    byChallenge: new Map(rows.map((row) => [row.challengeId, row])),
  };
}

export async function countJobSubmissions(jobId: string) {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(submissions)
    .innerJoin(challenges, eq(submissions.challengeId, challenges.id))
    .where(eq(challenges.jobId, jobId));
  return total;
}

export async function listUserSubmissions(userId: string, limit = 10) {
  return getDb().query.submissions.findMany({
    where: eq(submissions.userId, userId),
    with: { challenge: { with: { job: { columns: { title: true, slug: true } } } } },
    orderBy: [desc(submissions.startedAt)],
    limit,
  });
}

export async function listUserSkillScores(userId: string) {
  return getDb().query.skillScores.findMany({
    where: eq(skillScores.userId, userId),
    orderBy: [desc(skillScores.score)],
  });
}

export const getPortfolio = cache(async (handle: string) => {
  const user = await getDb().query.users.findFirst({
    where: and(eq(users.handle, handle), eq(users.role, "seeker")),
    with: { seekerProfile: true, skillScores: { orderBy: [desc(skillScores.score)] } },
  });
  if (!user) return null;

  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(submissions)
    .where(and(eq(submissions.userId, user.id), eq(submissions.status, "evaluated")));

  return { ...user, evaluatedCount: total };
});
