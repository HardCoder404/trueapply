"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { applicationEvents, applications, companies, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/queries";
import { getOpenJobBySlug } from "@/features/jobs/queries";
import { sendEmail } from "@/lib/email/send";
import { newApplicantEmail, stageChangedEmail } from "@/lib/email/templates";

import { getApplication, getCompanyApplication, jobSkillScore } from "./queries";
import { applySchema, bulkStageSchema, stageChangeSchema } from "./schemas";

export type ApplyState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
} | null;
export type StageState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  saved?: number;
} | null;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function account(role: "seeker" | "recruiter") {
  const { isAuthenticated } = await auth();
  const current = isAuthenticated ? await getCurrentUser() : null;
  return current?.role === role ? current : null;
}

function revalidateApplicationPaths(jobId: string, slug: string) {
  revalidatePath("/seeker/applications");
  revalidatePath("/seeker/dashboard");
  revalidatePath("/recruiter/dashboard");
  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath(`/recruiter/jobs/${jobId}/applicants`);
  revalidatePath(`/jobs/${slug}`);
  revalidatePath(`/jobs/${slug}/challenges`);
  revalidatePath("/jobs");
}

export async function applyToJob(
  _previous: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const seeker = await account("seeker");
  if (!seeker) return { message: "Sign in as a job seeker to apply." };

  const job = await getOpenJobBySlug(text(formData, "slug"));
  if (!job) return { message: "This role is no longer open." };

  if (await getApplication(job.id, seeker.id)) redirect("/seeker/applications");

  const { score, challenges } = await jobSkillScore(job.id, seeker.id);
  if (!challenges.length) {
    return { message: "Complete at least one challenge for this role before applying." };
  }

  const parsed = applySchema.safeParse({ note: text(formData, "note") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const db = getDb();
  const [application] = await db
    .insert(applications)
    .values({
      jobId: job.id,
      userId: seeker.id,
      skillScore: score,
      note: parsed.data.note,
    })
    .returning({ id: applications.id });
  await db
    .insert(applicationEvents)
    .values({ applicationId: application.id, toStage: "applied", actorId: seeker.id });

  const recruiter = await db.query.users.findFirst({
    where: eq(users.id, job.company.userId),
  });
  if (recruiter) {
    await sendEmail({
      to: recruiter.email,
      ...newApplicantEmail({
        recruiterName: recruiter.name,
        seekerName: seeker.name,
        jobTitle: job.title,
        jobId: job.id,
        skillScore: score,
      }),
    });
  }

  revalidateApplicationPaths(job.id, job.slug);
  redirect("/seeker/applications");
}

async function transition(
  applicationId: string,
  companyId: string,
  companyName: string,
  stage: z.infer<typeof stageChangeSchema>["stage"],
  reason: string,
  actorId: string,
) {
  const row = await getCompanyApplication(applicationId, companyId);
  if (!row || row.application.status === stage) return null;

  const now = new Date();
  const db = getDb();
  await db.batch([
    db
      .update(applications)
      .set({
        status: stage,
        reason,
        stageChangedAt: now,
        firstResponseAt: row.application.firstResponseAt ?? now,
        updatedAt: now,
      })
      .where(eq(applications.id, applicationId)),
    db.insert(applicationEvents).values({
      applicationId,
      fromStage: row.application.status,
      toStage: stage,
      reason,
      actorId,
    }),
  ]);

  const seeker = await db.query.users.findFirst({
    where: eq(users.id, row.application.userId),
  });
  if (seeker) {
    await sendEmail({
      to: seeker.email,
      ...stageChangedEmail({
        seekerName: seeker.name,
        jobTitle: row.jobTitle,
        companyName,
        stage,
        reason,
      }),
    });
  }
  return row;
}

export async function moveStage(
  _previous: StageState,
  formData: FormData,
): Promise<StageState> {
  const recruiter = await account("recruiter");
  if (!recruiter?.company) return { message: "Sign in as a recruiter." };

  const parsed = stageChangeSchema.safeParse({
    applicationId: text(formData, "applicationId"),
    stage: text(formData, "stage"),
    reason: text(formData, "reason"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const row = await transition(
    parsed.data.applicationId,
    recruiter.company.id,
    recruiter.company.name,
    parsed.data.stage,
    parsed.data.reason,
    recruiter.id,
  );
  if (!row) return { message: "That application is already at this stage." };

  const job = await getDb().query.jobs.findFirst({
    where: eq(jobs.id, row.jobId),
    columns: { slug: true },
  });
  revalidateApplicationPaths(row.jobId, job?.slug ?? "");
  return { saved: 1 };
}

export async function bulkMoveStage(
  _previous: StageState,
  formData: FormData,
): Promise<StageState> {
  const recruiter = await account("recruiter");
  if (!recruiter?.company) return { message: "Sign in as a recruiter." };

  const parsed = bulkStageSchema.safeParse({
    ids: formData.getAll("ids").filter((id): id is string => typeof id === "string"),
    stage: text(formData, "stage"),
    reason: text(formData, "reason"),
  });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return { errors, message: errors.ids?.[0] };
  }

  let saved = 0;
  let jobId: string | null = null;
  for (const id of parsed.data.ids) {
    const row = await transition(
      id,
      recruiter.company.id,
      recruiter.company.name,
      parsed.data.stage,
      parsed.data.reason,
      recruiter.id,
    );
    if (row) {
      saved += 1;
      jobId = row.jobId;
    }
  }

  if (jobId) {
    const job = await getDb().query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      columns: { slug: true },
    });
    revalidateApplicationPaths(jobId, job?.slug ?? "");
  }
  return { saved };
}

export async function markNudged(ids: string[]) {
  if (!ids.length) return;
  await getDb()
    .update(applications)
    .set({ nudgedAt: new Date() })
    .where(inArray(applications.id, ids));
}

export async function recruiterForCompany(companyId: string) {
  const company = await getDb().query.companies.findFirst({
    where: and(eq(companies.id, companyId)),
  });
  if (!company) return null;
  return getDb().query.users.findFirst({ where: eq(users.id, company.userId) });
}
