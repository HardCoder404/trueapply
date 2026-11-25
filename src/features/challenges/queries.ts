import { cache } from "react";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { challenges, skillScores, submissions, users } from "@/db/schema";

export async function listJobChallenges(jobId: string) {
  return getDb().query.challenges.findMany({
    where: and(eq(challenges.jobId, jobId), eq(challenges.active, true)),
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
  const allChallenges = await getDb().query.challenges.findMany({
    where: eq(challenges.jobId, jobId),
    orderBy: [
      desc(challenges.active),
      asc(challenges.createdAt),
      asc(challenges.position),
    ],
  });
  if (!allChallenges.length) return { challenges: allChallenges, byChallenge: new Map() };

  const rows = await getDb().query.submissions.findMany({
    where: and(
      eq(submissions.userId, userId),
      inArray(
        submissions.challengeId,
        allChallenges.map((c) => c.id),
      ),
    ),
  });
  const byChallenge = new Map(rows.map((row) => [row.challengeId, row]));
  const visible = allChallenges.filter((c) => c.active || byChallenge.has(c.id));

  return { challenges: visible, byChallenge };
}

export async function listJobSubmissions(jobId: string) {
  const db = getDb();
  const rows = await db.query.submissions.findMany({
    where: inArray(
      submissions.challengeId,
      db
        .select({ id: challenges.id })
        .from(challenges)
        .where(eq(challenges.jobId, jobId)),
    ),
    with: {
      challenge: {
        columns: {
          id: true,
          title: true,
          skill: true,
          language: true,
          active: true,
          rubric: true,
        },
      },
      user: {
        columns: { id: true, name: true, handle: true },
        with: { seekerProfile: { columns: { headline: true } } },
      },
    },
    orderBy: [desc(submissions.startedAt)],
  });

  type Row = (typeof rows)[number];
  const byUser = new Map<string, { user: Row["user"]; submissions: Row[] }>();
  for (const row of rows) {
    const entry = byUser.get(row.userId) ?? { user: row.user, submissions: [] };
    entry.submissions.push(row);
    byUser.set(row.userId, entry);
  }

  const best = (list: Row[]) =>
    list.reduce((max, row) => Math.max(max, row.score ?? -1), -1);
  return [...byUser.values()].sort((a, b) => best(b.submissions) - best(a.submissions));
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
