import { cache } from "react";
import { and, asc, count, desc, eq, gte, inArray, lt, max, ne, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { applications, challenges, jobs, submissions } from "@/db/schema";
import { recruiterResponseWindowDays } from "@/lib/constants";

import type { ApplicantFilters } from "./schemas";

const windowMs = recruiterResponseWindowDays * 86_400_000;

export const jobSkillScore = cache(async (jobId: string, userId: string) => {
  const rows = await getDb()
    .select({
      title: challenges.title,
      skill: challenges.skill,
      score: submissions.score,
    })
    .from(submissions)
    .innerJoin(challenges, eq(submissions.challengeId, challenges.id))
    .where(
      and(
        eq(challenges.jobId, jobId),
        eq(submissions.userId, userId),
        eq(submissions.status, "evaluated"),
      ),
    )
    .orderBy(asc(challenges.position));

  const scored = rows.filter(
    (row): row is typeof row & { score: number } => row.score != null,
  );
  const score = scored.length
    ? Math.round(scored.reduce((sum, row) => sum + row.score, 0) / scored.length)
    : null;

  return { score, challenges: scored };
});

export const getApplication = cache(async (jobId: string, userId: string) => {
  const application = await getDb().query.applications.findFirst({
    where: and(eq(applications.jobId, jobId), eq(applications.userId, userId)),
  });
  return application ?? null;
});

export async function listSeekerApplications(userId: string) {
  return getDb().query.applications.findMany({
    where: eq(applications.userId, userId),
    with: {
      job: {
        columns: { id: true, title: true, slug: true, status: true },
        with: { company: { columns: { name: true } } },
      },
      events: { orderBy: [asc(sql`created_at`)] },
    },
    orderBy: [desc(applications.updatedAt)],
  });
}

export async function seekerApplicationsVersion(userId: string) {
  const [row] = await getDb()
    .select({ version: max(applications.updatedAt) })
    .from(applications)
    .where(eq(applications.userId, userId));
  return row?.version?.getTime() ?? 0;
}

export async function listJobApplicants(jobId: string, filters: ApplicantFilters) {
  const conditions = [eq(applications.jobId, jobId)];
  if (filters.min) conditions.push(gte(applications.skillScore, filters.min));
  if (filters.stage) conditions.push(eq(applications.status, filters.stage));

  const rows = await getDb().query.applications.findMany({
    where: and(...conditions),
    with: {
      user: {
        columns: { id: true, name: true, handle: true },
        with: {
          seekerProfile: {
            columns: {
              headline: true,
              skills: true,
              experienceLevel: true,
              location: true,
            },
          },
        },
      },
    },
    orderBy: [
      sql`${applications.skillScore} desc nulls last`,
      asc(applications.appliedAt),
    ],
  });

  return rows.filter((row) => {
    const profile = row.user.seekerProfile;
    if (filters.level && profile?.experienceLevel !== filters.level) return false;
    if (filters.skill) {
      const wanted = filters.skill.toLowerCase();
      if (!profile?.skills.some((skill) => skill.toLowerCase() === wanted)) return false;
    }
    return true;
  });
}

export async function countJobApplicants(jobId: string) {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(applications)
    .where(eq(applications.jobId, jobId));
  return total;
}

export async function countWaitingApplicants(companyId: string) {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(jobs.companyId, companyId), eq(applications.status, "applied")));
  return total;
}

export const getCompanyApplication = cache(async (id: string, companyId: string) => {
  const [row] = await getDb()
    .select({ application: applications, jobTitle: jobs.title, jobId: jobs.id })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(applications.id, id), eq(jobs.companyId, companyId)))
    .limit(1);
  return row ?? null;
});

export type ResponseStats = {
  total: number;
  responseRate: number | null;
  slowResponder: boolean;
  completedHires: number;
};

export async function companyResponseStats(companyIds: string[]) {
  const stats = new Map<string, ResponseStats>();
  if (!companyIds.length) return stats;

  const staleBefore = new Date(Date.now() - windowMs);
  const rows = await getDb()
    .select({
      companyId: jobs.companyId,
      total: count(),
      responded: count(
        sql`case when ${applications.firstResponseAt} is not null and ${applications.firstResponseAt} - ${applications.appliedAt} <= interval '${sql.raw(String(recruiterResponseWindowDays))} days' then 1 end`,
      ),
      stale: count(
        sql`case when ${applications.status} = 'applied' and ${applications.appliedAt} < ${staleBefore} then 1 end`,
      ),
      hires: count(sql`case when ${applications.status} = 'offered' then 1 end`),
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(inArray(jobs.companyId, companyIds), ne(jobs.status, "draft")))
    .groupBy(jobs.companyId);

  for (const row of rows) {
    stats.set(row.companyId, {
      total: row.total,
      responseRate: row.total >= 3 ? row.responded / row.total : null,
      slowResponder: row.stale > 0,
      completedHires: row.hires,
    });
  }
  return stats;
}

export async function staleApplicationsForNudge() {
  const cutoff = new Date(Date.now() - 5 * 86_400_000);
  return getDb()
    .select({
      applicationId: applications.id,
      appliedAt: applications.appliedAt,
      jobId: jobs.id,
      jobTitle: jobs.title,
      recruiterId: jobs.companyId,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(applications.status, "applied"),
        lt(applications.appliedAt, cutoff),
        sql`${applications.nudgedAt} is null`,
        eq(jobs.status, "open"),
      ),
    );
}
