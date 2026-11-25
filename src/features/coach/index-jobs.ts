import { and, eq, gt, inArray, notInArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { jobEmbeddings, jobs } from "@/db/schema";
import { embed } from "@/lib/ai/embeddings";
import { formatSalaryRange } from "@/lib/format";

import type { Job } from "@/features/jobs/types";

type IndexableJob = Pick<
  Job,
  | "id"
  | "title"
  | "description"
  | "skills"
  | "location"
  | "remote"
  | "salaryMin"
  | "salaryMax"
> & {
  companyName: string;
  industry?: string | null;
};

export function jobDocument(job: IndexableJob) {
  return [
    `Role: ${job.title} at ${job.companyName}`,
    job.industry ? `Industry: ${job.industry}` : null,
    `Location: ${job.location}${job.remote ? " (remote friendly)" : ""}`,
    `Salary: ${formatSalaryRange(job.salaryMin, job.salaryMax)} per year`,
    `Skills: ${job.skills.join(", ")}`,
    job.description.slice(0, 1500),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function indexJobs(list: IndexableJob[]) {
  if (!list.length) return 0;
  const vectors = await embed(list.map(jobDocument));
  const db = getDb();
  for (const [i, job] of list.entries()) {
    await db
      .insert(jobEmbeddings)
      .values({ jobId: job.id, content: jobDocument(job), embedding: vectors[i] })
      .onConflictDoUpdate({
        target: jobEmbeddings.jobId,
        set: { content: jobDocument(job), embedding: vectors[i], updatedAt: sql`now()` },
      });
  }
  return list.length;
}

export async function indexJobById(jobId: string) {
  const job = await getDb().query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: { company: true },
  });
  if (!job || job.status !== "open") return 0;
  return indexJobs([
    { ...job, companyName: job.company.name, industry: job.company.industry },
  ]);
}

export async function removeJobIndex(jobIds: string[]) {
  if (!jobIds.length) return;
  await getDb().delete(jobEmbeddings).where(inArray(jobEmbeddings.jobId, jobIds));
}

export async function reindexOpenJobs() {
  const db = getDb();
  const open = await db.query.jobs.findMany({
    where: and(eq(jobs.status, "open"), gt(jobs.deadline, new Date())),
    with: { company: true },
  });
  const openIds = open.map((job) => job.id);

  const indexed = await indexJobs(
    open.map((job) => ({
      ...job,
      companyName: job.company.name,
      industry: job.company.industry,
    })),
  );
  const removed = openIds.length
    ? await db
        .delete(jobEmbeddings)
        .where(notInArray(jobEmbeddings.jobId, openIds))
        .returning({ id: jobEmbeddings.jobId })
    : await db.delete(jobEmbeddings).returning({ id: jobEmbeddings.jobId });

  return { indexed, removed: removed.length };
}
