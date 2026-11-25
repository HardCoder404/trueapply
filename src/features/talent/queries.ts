import "server-only";

import { cache } from "react";
import { and, cosineDistance, desc, eq, ilike, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  candidateMatches,
  companies,
  invites,
  jobs,
  seekerEmbeddings,
  seekerProfiles,
  skillScores,
  users,
} from "@/db/schema";
import { embedOne } from "@/lib/ai/embeddings";

import { candidateLabel } from "./anonymous";
import type { TalentFilters } from "./schemas";

export const talentPageSize = 20;

type VerifiedSkill = { skill: string; score: number };

const verifiedSkills = sql<
  VerifiedSkill[]
>`coalesce((select json_agg(json_build_object('skill', ss.skill, 'score', ss.score) order by ss.score desc) from skill_scores ss where ss.user_id = ${users.id}), '[]'::json)`;
const averageScore = sql<number>`(select coalesce(avg(ss.score), 0)::int from skill_scores ss where ss.user_id = ${users.id})`;
const gradedCount = sql<number>`(select count(*)::int from submissions s where s.user_id = ${users.id} and s.status = 'evaluated')`;
const hasVerified = sql`exists (select 1 from skill_scores ss where ss.user_id = ${users.id})`;

export type TalentRow = {
  id: string;
  label: string;
  level: (typeof seekerProfiles.$inferSelect)["experienceLevel"];
  location: string | null;
  preferredRoles: string[];
  claimed: string[];
  verified: VerifiedSkill[];
  average: number;
  graded: number;
  inviteStatuses: string[];
};

export async function listTalent(filters: TalentFilters, companyId: string) {
  const db = getDb();
  const conditions = [
    eq(users.role, "seeker"),
    eq(seekerProfiles.discoverable, true),
    hasVerified,
  ];
  if (filters.skill) {
    const skill = filters.skill.toLowerCase();
    conditions.push(
      filters.min != null
        ? sql`exists (select 1 from skill_scores ss where ss.user_id = ${users.id} and lower(ss.skill) = ${skill} and ss.score >= ${filters.min})`
        : sql`exists (select 1 from skill_scores ss where ss.user_id = ${users.id} and lower(ss.skill) = ${skill})`,
    );
  } else if (filters.min != null) {
    conditions.push(sql`${averageScore} >= ${filters.min}`);
  }
  if (filters.level) conditions.push(eq(seekerProfiles.experienceLevel, filters.level));
  if (filters.location)
    conditions.push(ilike(seekerProfiles.location, `%${filters.location}%`));

  const vector = filters.q ? await embedOne(filters.q) : null;
  const similarity = vector
    ? sql<number | null>`1 - (${cosineDistance(seekerEmbeddings.embedding, vector)})`
    : null;
  const inviteStatuses = sql<
    string[]
  >`coalesce((select array_agg(i.status::text) from invites i where i.user_id = ${users.id} and i.company_id = ${companyId}), '{}')`;

  const page = filters.page ?? 1;
  const rows = await db
    .select({
      id: users.id,
      level: seekerProfiles.experienceLevel,
      location: seekerProfiles.location,
      preferredRoles: seekerProfiles.preferredRoles,
      claimed: seekerProfiles.skills,
      verified: verifiedSkills,
      average: averageScore,
      graded: gradedCount,
      inviteStatuses,
    })
    .from(users)
    .innerJoin(seekerProfiles, eq(seekerProfiles.userId, users.id))
    .leftJoin(seekerEmbeddings, eq(seekerEmbeddings.userId, users.id))
    .where(and(...conditions))
    .orderBy(
      similarity ? sql`${similarity} desc nulls last` : desc(averageScore),
      desc(users.createdAt),
    )
    .limit(talentPageSize + 1)
    .offset((page - 1) * talentPageSize);

  const hasMore = rows.length > talentPageSize;
  const items: TalentRow[] = rows.slice(0, talentPageSize).map((row) => ({
    ...row,
    label: candidateLabel(row.id),
    claimed: row.claimed.filter(
      (s) => !row.verified.some((v) => v.skill.toLowerCase() === s.toLowerCase()),
    ),
  }));
  return { items, hasMore, page };
}

export const getCandidate = cache(async (userId: string) => {
  const user = await getDb().query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.role, "seeker")),
    with: { seekerProfile: true, skillScores: { orderBy: [desc(skillScores.score)] } },
  });
  if (!user?.seekerProfile?.discoverable || !user.skillScores.length) return null;

  const [{ graded }] = await getDb()
    .select({ graded: gradedCount })
    .from(users)
    .where(eq(users.id, userId));
  const verified = user.skillScores.map((s) => ({ skill: s.skill, score: s.score }));
  return {
    id: user.id,
    label: candidateLabel(user.id),
    level: user.seekerProfile.experienceLevel,
    location: user.seekerProfile.location,
    preferredRoles: user.seekerProfile.preferredRoles,
    claimed: user.seekerProfile.skills.filter(
      (s) => !verified.some((v) => v.skill.toLowerCase() === s.toLowerCase()),
    ),
    verified,
    average: Math.round(verified.reduce((sum, v) => sum + v.score, 0) / verified.length),
    graded,
  };
});

export async function listJobMatches(jobId: string) {
  const rows = await getDb().query.candidateMatches.findMany({
    where: eq(candidateMatches.jobId, jobId),
    orderBy: [desc(candidateMatches.score)],
    with: {
      user: {
        columns: { id: true },
        with: {
          seekerProfile: {
            columns: {
              experienceLevel: true,
              location: true,
              preferredRoles: true,
              skills: true,
            },
          },
          skillScores: { orderBy: [desc(skillScores.score)] },
        },
      },
    },
  });
  return rows.map((row) => ({
    ...row,
    label: candidateLabel(row.userId),
    verified: row.user.skillScores.map((s) => ({ skill: s.skill, score: s.score })),
    profile: row.user.seekerProfile,
  }));
}

export async function listJobInvites(jobId: string) {
  return getDb().query.invites.findMany({
    where: eq(invites.jobId, jobId),
    columns: { id: true, userId: true, status: true },
  });
}

export async function listCandidateInvites(userId: string, companyId: string) {
  return getDb().query.invites.findMany({
    where: and(eq(invites.userId, userId), eq(invites.companyId, companyId)),
    with: { job: { columns: { id: true, title: true } } },
    orderBy: [desc(invites.createdAt)],
  });
}

export async function listCompanyInvites(companyId: string) {
  return getDb().query.invites.findMany({
    where: eq(invites.companyId, companyId),
    with: {
      job: { columns: { id: true, title: true, slug: true } },
      user: {
        columns: { id: true, name: true, handle: true },
        with: {
          seekerProfile: { columns: { experienceLevel: true, location: true } },
          skillScores: { orderBy: [desc(skillScores.score)] },
        },
      },
    },
    orderBy: [desc(invites.createdAt)],
  });
}

export async function listSeekerInvites(userId: string) {
  return getDb().query.invites.findMany({
    where: eq(invites.userId, userId),
    with: {
      job: {
        columns: {
          id: true,
          title: true,
          slug: true,
          location: true,
          remote: true,
          status: true,
          realityScore: true,
        },
      },
      company: { columns: { name: true, verified: true, industry: true } },
    },
    orderBy: [desc(invites.createdAt)],
  });
}

export async function countPendingInvites(userId: string) {
  const [{ total }] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(invites)
    .where(and(eq(invites.userId, userId), eq(invites.status, "pending")));
  return total;
}

export const getSeekerInvite = cache(async (id: string, userId: string) => {
  const [row] = await getDb()
    .select({ invite: invites, job: jobs, company: companies })
    .from(invites)
    .innerJoin(jobs, eq(invites.jobId, jobs.id))
    .innerJoin(companies, eq(invites.companyId, companies.id))
    .where(and(eq(invites.id, id), eq(invites.userId, userId)))
    .limit(1);
  return row ?? null;
});

export async function getMatchReasoning(jobId: string, userId: string) {
  const row = await getDb().query.candidateMatches.findFirst({
    where: and(eq(candidateMatches.jobId, jobId), eq(candidateMatches.userId, userId)),
    columns: { reasoning: true, score: true },
  });
  return row ?? null;
}
