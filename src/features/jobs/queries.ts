import { cache } from "react";
import {
  and,
  arrayOverlaps,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { getDb } from "@/db";
import { jobs } from "@/db/schema";
import { companyResponseStats } from "@/features/applications/queries";
import { lakhsToInr } from "@/lib/format";

import type { CompanyHistory } from "./reality-score";
import type { JobFilters } from "./schemas";

export const pageSize = 20;

function openJobConditions() {
  return [eq(jobs.status, "open"), gt(jobs.deadline, new Date())];
}

export async function listOpenJobs(filters: JobFilters) {
  const db = getDb();
  const conditions = openJobConditions();

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(jobs.title, pattern), ilike(jobs.description, pattern))!);
  }
  if (filters.location) conditions.push(ilike(jobs.location, `%${filters.location}%`));
  if (filters.remote) conditions.push(eq(jobs.remote, true));
  if (filters.min) conditions.push(gte(jobs.salaryMax, lakhsToInr(filters.min)));
  if (filters.skill) conditions.push(arrayOverlaps(jobs.skills, [filters.skill]));

  const where = and(...conditions);
  const page = filters.page ?? 1;

  const [rows, [{ total }]] = await Promise.all([
    db.query.jobs.findMany({
      where,
      with: { company: true },
      orderBy: [sql`${jobs.realityScore} desc nulls last`, desc(jobs.publishedAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ total: count() }).from(jobs).where(where),
  ]);

  return { jobs: rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export const getOpenJobBySlug = cache(async (slug: string) => {
  const job = await getDb().query.jobs.findFirst({
    where: and(eq(jobs.slug, slug), ...openJobConditions()),
    with: { company: true },
  });
  return job ?? null;
});

export async function listOpenJobSlugs() {
  return getDb()
    .select({ slug: jobs.slug, updatedAt: jobs.updatedAt })
    .from(jobs)
    .where(and(...openJobConditions()))
    .orderBy(desc(jobs.publishedAt))
    .limit(1000);
}

export async function listCompanyJobs(companyId: string) {
  return getDb().query.jobs.findMany({
    where: eq(jobs.companyId, companyId),
    orderBy: [desc(jobs.updatedAt)],
  });
}

export const getCompanyJob = cache(async (id: string, companyId: string) => {
  const job = await getDb().query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.companyId, companyId)),
  });
  return job ?? null;
});

export async function countRecentJobs(companyId: string, since: Date) {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), gt(jobs.createdAt, since)));
  return total;
}

export async function companyHistory(
  companyId: string,
  verified: boolean,
): Promise<CompanyHistory> {
  const stats = (await companyResponseStats([companyId])).get(companyId);
  return {
    verified,
    completedHires: stats?.completedHires ?? 0,
    responseRate: stats?.responseRate ?? null,
    slowResponder: stats?.slowResponder ?? false,
  };
}
