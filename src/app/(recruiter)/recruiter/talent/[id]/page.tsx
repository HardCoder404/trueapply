import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/features/auth/queries";
import { listCompanyJobs } from "@/features/jobs/queries";
import { InviteForm } from "@/features/talent/components/invite-form";
import {
  getCandidate,
  getMatchReasoning,
  listCandidateInvites,
} from "@/features/talent/queries";
import { experienceLevelLabels } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Candidate",
  robots: { index: false },
};

type CandidatePageProps = PageProps<"/recruiter/talent/[id]">;

const inviteStatus = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
} as const;

async function Candidate({ params, searchParams }: CandidatePageProps) {
  await connection();
  const account = await requireRole("recruiter");
  const company = account.company;
  if (!company) return null;

  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  const jobParam = (await searchParams).job;
  const requestedJobId = typeof jobParam === "string" ? jobParam : null;

  const [jobs, sent] = await Promise.all([
    listCompanyJobs(company.id),
    listCandidateInvites(candidate.id, company.id),
  ]);
  const openJobs = jobs
    .filter((job) => job.status === "open")
    .map((job) => ({
      id: job.id,
      title: job.title,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    }));
  const initialJobId = openJobs.some((j) => j.id === requestedJobId)
    ? requestedJobId
    : null;
  const match = initialJobId ? await getMatchReasoning(initialJobId, candidate.id) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-8">
        <Link
          href="/recruiter/talent"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Talent pool
        </Link>

        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Anonymous profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {candidate.label}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {[
              candidate.level && experienceLevelLabels[candidate.level],
              candidate.location,
            ]
              .filter(Boolean)
              .join(" · ") || "Level and location not shared"}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-5 rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10 sm:p-6">
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Average verified
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {candidate.average}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Challenges graded
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {candidate.graded}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-mono text-xs text-muted-foreground uppercase">Wants</dt>
            <dd className="mt-1 font-medium">
              {candidate.preferredRoles.length
                ? candidate.preferredRoles.join(", ")
                : "Not specified"}
            </dd>
          </div>
        </dl>

        <section>
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Skills
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {candidate.verified.map((skill) => (
              <li key={skill.skill}>
                <Badge className="h-7 gap-1.5 px-3 font-normal">
                  {skill.skill}
                  <span className="font-mono tabular-nums opacity-70">{skill.score}</span>
                </Badge>
              </li>
            ))}
            {candidate.claimed.map((skill) => (
              <li key={skill}>
                <Badge
                  variant="outline"
                  className="h-7 px-3 font-normal text-muted-foreground"
                >
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Filled badges are graded work samples. Outlined ones are self-reported. Name,
            photo and history stay hidden until they accept.
          </p>
        </section>

        {sent.length > 0 && (
          <section>
            <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Your invitations to this candidate
            </h2>
            <ul className="mt-4 divide-y rounded-xl ring-1 ring-foreground/10">
              {sent.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-4 p-4 text-sm"
                >
                  <span className="min-w-0 truncate">{invite.job.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground uppercase">
                    {inviteStatus[invite.status]} · {formatDate(invite.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="h-fit rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Invite to interview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          They see the role, your range and your reasons before deciding.
        </p>
        <div className="mt-6">
          {openJobs.length ? (
            <InviteForm
              candidateId={candidate.id}
              jobs={openJobs}
              initialJobId={initialJobId}
              initialMessage={match?.reasoning ?? ""}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Publish a role first.{" "}
              <Link href="/recruiter/jobs/new" className="underline underline-offset-4">
                Post a role
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CandidatePage(props: CandidatePageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Candidate {...props} />
    </Suspense>
  );
}
