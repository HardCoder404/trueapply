"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { applicationEvents, applications, challenges, invites, users } from "@/db/schema";
import { getApplication, jobSkillScore } from "@/features/applications/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { listJobChallenges } from "@/features/challenges/queries";
import { getCompanyJob } from "@/features/jobs/queries";
import { sendEmail } from "@/lib/email/send";
import { inviteEmail, inviteRespondedEmail } from "@/lib/email/templates";
import { formatSalaryRange, lakhsToInr } from "@/lib/format";

import { rankCandidatesForJob } from "./matching";
import { getCandidate, getSeekerInvite } from "./queries";
import { briefSchema, inviteSchema, respondSchema } from "./schemas";

export type InviteState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
} | null;

export type BriefState = InviteState;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function account(role: "seeker" | "recruiter") {
  const { isAuthenticated } = await auth();
  const current = isAuthenticated ? await getCurrentUser() : null;
  return current?.role === role ? current : null;
}

export async function sendInvite(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const recruiter = await account("recruiter");
  const company = recruiter?.company;
  if (!recruiter || !company) return { message: "Sign in as a recruiter." };

  const candidateId = text(formData, "candidateId");
  const parsed = inviteSchema.safeParse({
    jobId: text(formData, "jobId"),
    salaryMinLakhs: text(formData, "salaryMinLakhs"),
    salaryMaxLakhs: text(formData, "salaryMaxLakhs"),
    message: text(formData, "message"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const [candidate, job] = await Promise.all([
    getCandidate(candidateId),
    getCompanyJob(parsed.data.jobId, company.id),
  ]);
  if (!candidate) return { message: "This candidate is no longer discoverable." };
  if (!job || job.status !== "open") return { message: "Pick a role that is open." };
  if (await getApplication(job.id, candidate.id)) {
    return { message: "They already applied to this role. Find them under Applicants." };
  }

  const db = getDb();
  const existing = await db.query.invites.findFirst({
    where: and(eq(invites.jobId, job.id), eq(invites.userId, candidate.id)),
  });
  if (existing) return { message: "You already invited this candidate to that role." };

  const match = await db.query.candidateMatches.findFirst({
    where: (m, { and: both, eq: equal }) =>
      both(equal(m.jobId, job.id), equal(m.userId, candidate.id)),
    columns: { score: true },
  });
  await db.insert(invites).values({
    jobId: job.id,
    userId: candidate.id,
    companyId: company.id,
    message: parsed.data.message,
    salaryMin: lakhsToInr(parsed.data.salaryMinLakhs),
    salaryMax: lakhsToInr(parsed.data.salaryMaxLakhs),
    matchScore: match?.score ?? null,
  });

  const seeker = await db.query.users.findFirst({ where: eq(users.id, candidate.id) });
  if (seeker) {
    await sendEmail({
      to: seeker.email,
      ...inviteEmail({
        seekerName: seeker.name,
        companyName: company.name,
        jobTitle: job.title,
        salary: formatSalaryRange(
          lakhsToInr(parsed.data.salaryMinLakhs),
          lakhsToInr(parsed.data.salaryMaxLakhs),
        ),
        message: parsed.data.message,
      }),
    });
  }

  revalidatePath("/recruiter/invites");
  revalidatePath("/recruiter/talent");
  revalidatePath(`/recruiter/talent/${candidate.id}`);
  revalidatePath(`/recruiter/jobs/${job.id}/matches`);
  revalidatePath("/seeker/invites");
  revalidatePath("/seeker/dashboard");
  redirect("/recruiter/invites");
}

export async function respondToInvite(formData: FormData) {
  const seeker = await account("seeker");
  if (!seeker) return;

  const parsed = respondSchema.safeParse({
    inviteId: text(formData, "inviteId"),
    decision: text(formData, "decision"),
    declineReason: text(formData, "declineReason"),
  });
  if (!parsed.success) return;

  const row = await getSeekerInvite(parsed.data.inviteId, seeker.id);
  if (!row || row.invite.status !== "pending") return;

  const db = getDb();
  const now = new Date();
  let applicationId: string | null = null;

  if (parsed.data.decision === "accept" && row.job.status === "open") {
    const existing = await getApplication(row.job.id, seeker.id);
    if (existing) {
      applicationId = existing.id;
    } else {
      const { score } = await jobSkillScore(row.job.id, seeker.id);
      const [application] = await db
        .insert(applications)
        .values({
          jobId: row.job.id,
          userId: seeker.id,
          status: "interview",
          skillScore: score,
          note: "Accepted an interview invitation.",
          reason: "Invited by the company",
          stageChangedAt: now,
          firstResponseAt: now,
        })
        .returning({ id: applications.id });
      applicationId = application.id;
      await db.insert(applicationEvents).values([
        { applicationId, toStage: "applied", actorId: seeker.id },
        {
          applicationId,
          fromStage: "applied",
          toStage: "interview",
          reason: "Accepted the company's interview invitation",
          actorId: seeker.id,
        },
      ]);
    }
  }

  const accepted = parsed.data.decision === "accept";
  await db
    .update(invites)
    .set({
      status: accepted ? "accepted" : "declined",
      declineReason: accepted ? null : (parsed.data.declineReason ?? null),
      applicationId,
      respondedAt: now,
    })
    .where(eq(invites.id, row.invite.id));

  const recruiter = await db.query.users.findFirst({
    where: eq(users.id, row.company.userId),
  });
  if (recruiter) {
    await sendEmail({
      to: recruiter.email,
      ...inviteRespondedEmail({
        recruiterName: recruiter.name,
        seekerName: seeker.name,
        jobTitle: row.job.title,
        jobId: row.job.id,
        accepted,
        reason: accepted ? null : (parsed.data.declineReason ?? null),
      }),
    });
  }

  revalidatePath("/seeker/invites");
  revalidatePath("/seeker/applications");
  revalidatePath("/seeker/dashboard");
  revalidatePath("/recruiter/invites");
  revalidatePath("/recruiter/dashboard");
  revalidatePath(`/recruiter/jobs/${row.job.id}`);
  revalidatePath(`/recruiter/jobs/${row.job.id}/applicants`);
  redirect(accepted ? "/seeker/applications" : "/seeker/invites");
}

export async function rankCandidates(formData: FormData) {
  const recruiter = await account("recruiter");
  const company = recruiter?.company;
  const job = company ? await getCompanyJob(text(formData, "jobId"), company.id) : null;
  if (!job || !company) return;

  await rankCandidatesForJob({ ...job, company });

  revalidatePath(`/recruiter/jobs/${job.id}/matches`);
  redirect(`/recruiter/jobs/${job.id}/matches`);
}

export async function createBrief(
  _previous: BriefState,
  formData: FormData,
): Promise<BriefState> {
  const recruiter = await account("recruiter");
  const company = recruiter?.company;
  const job = company ? await getCompanyJob(text(formData, "jobId"), company.id) : null;
  if (!job || job.status === "archived")
    return { message: "This role cannot take briefs." };

  const parsed = briefSchema.safeParse({
    title: text(formData, "title"),
    skill: text(formData, "skill"),
    type: text(formData, "type"),
    difficulty: text(formData, "difficulty"),
    timeLimitMinutes: text(formData, "timeLimitMinutes"),
    language: text(formData, "language"),
    description: text(formData, "description"),
    starterCode: text(formData, "starterCode"),
    rubric: text(formData, "rubric")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const position = (await listJobChallenges(job.id)).length;
  await getDb()
    .insert(challenges)
    .values({
      jobId: job.id,
      title: parsed.data.title,
      description: parsed.data.description,
      skill: parsed.data.skill,
      type: parsed.data.type,
      difficulty: parsed.data.difficulty,
      timeLimitMinutes: parsed.data.timeLimitMinutes,
      language: parsed.data.language ?? null,
      starterCode: parsed.data.starterCode ?? null,
      rubric: parsed.data.rubric,
      position,
      custom: true,
    });

  revalidatePath(`/recruiter/jobs/${job.id}`);
  revalidatePath(`/jobs/${job.slug}/challenges`);
  redirect(`/recruiter/jobs/${job.id}`);
}
