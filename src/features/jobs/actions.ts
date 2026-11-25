"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { jobs } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/queries";
import { createChallengesForJob } from "@/features/challenges/actions";
import { listJobChallenges } from "@/features/challenges/queries";
import { indexJobById, removeJobIndex } from "@/features/coach/index-jobs";
import { GroqUnavailableError } from "@/lib/ai/groq";
import { lakhsToInr, slugify } from "@/lib/format";

import { companyHistory, countRecentJobs, getCompanyJob } from "./queries";
import { scoreJob } from "./reality-score";
import { jobSchema } from "./schemas";

export type JobFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
} | null;

const dailyPostLimit = 10;

async function recruiterCompany() {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  if (!account || account.role !== "recruiter" || !account.company) return null;
  return account.company;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function ensureChallenges(job: {
  id: string;
  title: string;
  description: string;
  skills: string[];
}) {
  if ((await listJobChallenges(job.id)).length) return;
  try {
    await createChallengesForJob(job);
  } catch (error) {
    if (!(error instanceof GroqUnavailableError || error instanceof SyntaxError))
      throw error;
  }
}

async function syncIndex(jobId: string, open: boolean) {
  try {
    if (open) await indexJobById(jobId);
    else await removeJobIndex([jobId]);
  } catch (error) {
    console.error("Job index sync failed", error);
  }
}

function revalidateJobPaths(slug?: string) {
  revalidatePath("/jobs");
  revalidatePath("/recruiter/jobs");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/jobs/${slug}`);
}

export async function saveJob(
  _previous: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const company = await recruiterCompany();
  if (!company) return { message: "Only recruiters with a company can post roles." };

  const parsed = jobSchema.safeParse({
    title: text(formData, "title"),
    description: text(formData, "description"),
    salaryMinLakhs: text(formData, "salaryMinLakhs"),
    salaryMaxLakhs: text(formData, "salaryMaxLakhs"),
    location: text(formData, "location"),
    remote: formData.get("remote") === "on",
    skills: formData.getAll("skills").filter((s): s is string => typeof s === "string"),
    deadline: text(formData, "deadline"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const jobId = text(formData, "jobId") || null;
  const publish = text(formData, "intent") === "publish";
  const db = getDb();

  const existing = jobId ? await getCompanyJob(jobId, company.id) : null;
  if (jobId && !existing) return { message: "That role no longer exists." };
  if (existing?.status === "archived")
    return { message: "Archived roles cannot be edited." };

  if (!existing) {
    const recent = await countRecentJobs(company.id, new Date(Date.now() - 86_400_000));
    if (recent >= dailyPostLimit) {
      return {
        message: `You have posted ${dailyPostLimit} roles in the last day. Try again tomorrow.`,
      };
    }
  }

  const data = parsed.data;
  const id = existing?.id ?? crypto.randomUUID();
  const draft = {
    title: data.title,
    description: data.description,
    salaryMin: lakhsToInr(data.salaryMinLakhs),
    salaryMax: lakhsToInr(data.salaryMaxLakhs),
    location: data.location,
    remote: data.remote,
    skills: data.skills,
    deadline: data.deadline,
  };

  const scored = publish
    ? await scoreJob(draft, await companyHistory(company.id, company.verified))
    : null;
  const values = {
    ...draft,
    slug: existing?.slug ?? `${slugify(data.title)}-${id.slice(0, 6)}`,
    companyId: company.id,
    status: publish ? ("open" as const) : (existing?.status ?? ("draft" as const)),
    realityScore: scored?.score ?? existing?.realityScore ?? null,
    realityBreakdown: scored?.breakdown ?? existing?.realityBreakdown ?? null,
    publishedAt: publish
      ? (existing?.publishedAt ?? new Date())
      : (existing?.publishedAt ?? null),
  };

  if (existing) {
    await db.update(jobs).set(values).where(eq(jobs.id, id));
  } else {
    await db.insert(jobs).values({ id, ...values });
  }

  if (publish) await ensureChallenges({ id, ...draft });
  await syncIndex(id, values.status === "open");

  revalidateJobPaths(values.slug);
  redirect(`/recruiter/jobs/${id}`);
}

export async function publishJob(formData: FormData) {
  const company = await recruiterCompany();
  const job = company ? await getCompanyJob(text(formData, "jobId"), company.id) : null;
  if (!company || !job || job.status === "archived") return;

  const scored = await scoreJob(job, await companyHistory(company.id, company.verified));
  await getDb()
    .update(jobs)
    .set({
      status: "open",
      realityScore: scored.score,
      realityBreakdown: scored.breakdown,
      publishedAt: job.publishedAt ?? new Date(),
    })
    .where(eq(jobs.id, job.id));

  await ensureChallenges(job);
  await syncIndex(job.id, true);

  revalidateJobPaths(job.slug);
  redirect(`/recruiter/jobs/${job.id}`);
}

export async function closeJob(formData: FormData) {
  const company = await recruiterCompany();
  const job = company ? await getCompanyJob(text(formData, "jobId"), company.id) : null;
  if (!company || !job || job.status !== "open") return;

  await getDb().update(jobs).set({ status: "closed" }).where(eq(jobs.id, job.id));
  await syncIndex(job.id, false);

  revalidateJobPaths(job.slug);
  redirect(`/recruiter/jobs/${job.id}`);
}
