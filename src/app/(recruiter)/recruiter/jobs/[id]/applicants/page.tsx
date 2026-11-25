import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BulkBar, bulkFormId } from "@/features/applications/components/bulk-bar";
import { StageBadge, stageLabels } from "@/features/applications/components/stage-badge";
import { StageForm } from "@/features/applications/components/stage-form";
import { listJobApplicants } from "@/features/applications/queries";
import {
  applicantFiltersSchema,
  type ApplicantFilters,
} from "@/features/applications/schemas";
import { requireRole } from "@/features/auth/queries";
import { getCompanyJob } from "@/features/jobs/queries";
import {
  applicationStages,
  experienceLevelLabels,
  experienceLevels,
  recruiterResponseWindowDays,
} from "@/lib/constants";
import { daysSince, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Applicants",
  robots: { index: false },
};

type ApplicantsPageProps = PageProps<"/recruiter/jobs/[id]/applicants">;

function Filters({ jobId, filters }: { jobId: string; filters: ApplicantFilters }) {
  return (
    <form
      method="get"
      action={`/recruiter/jobs/${jobId}/applicants`}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_auto_auto_auto]"
    >
      <label className="sr-only" htmlFor="min">
        Minimum score
      </label>
      <Input
        id="min"
        name="min"
        type="number"
        min={0}
        max={100}
        placeholder="Min score"
        defaultValue={filters.min ?? ""}
        className="h-11 lg:w-32"
      />
      <label className="sr-only" htmlFor="skill">
        Skill
      </label>
      <Input
        id="skill"
        name="skill"
        placeholder="Has skill"
        defaultValue={filters.skill ?? ""}
        className="h-11"
      />
      <label className="sr-only" htmlFor="level">
        Experience
      </label>
      <select
        id="level"
        name="level"
        defaultValue={filters.level ?? ""}
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        <option value="">Any experience</option>
        {experienceLevels.map((level) => (
          <option key={level} value={level}>
            {experienceLevelLabels[level]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="stage">
        Stage
      </label>
      <select
        id="stage"
        name="stage"
        defaultValue={filters.stage ?? ""}
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        <option value="">Any stage</option>
        {applicationStages.map((stage) => (
          <option key={stage} value={stage}>
            {stageLabels[stage]}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" className="h-11 px-4 text-sm">
        Filter
      </Button>
    </form>
  );
}

async function Applicants({ params, searchParams }: ApplicantsPageProps) {
  await connection();
  const account = await requireRole("recruiter");
  const job = account.company
    ? await getCompanyJob((await params).id, account.company.id)
    : null;
  if (!job) notFound();

  const parsed = applicantFiltersSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const rows = await listJobApplicants(job.id, filters);
  const waiting = rows.filter((row) => row.status === "applied").length;

  return (
    <>
      <Link
        href={`/recruiter/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {job.title}
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Applicants
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {rows.length} applicant{rows.length === 1 ? "" : "s"}, ranked by score.
          </h1>
        </div>
        {waiting > 0 && (
          <p className="font-mono text-xs text-muted-foreground uppercase">
            {waiting} waiting for a first response
          </p>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <Filters jobId={job.id} filters={filters} />
        {rows.length > 0 && <BulkBar />}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          No applicants match. Candidates apply after completing a challenge, so share the
          public page.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((application) => {
            const profile = application.user.seekerProfile;
            const stale =
              application.status === "applied" &&
              daysSince(application.appliedAt) >= recruiterResponseWindowDays;
            return (
              <li
                key={application.id}
                className={`rounded-xl ring-1 ${stale ? "ring-foreground/40" : "ring-foreground/10"}`}
              >
                <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
                  <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border has-checked:border-foreground">
                    <input
                      type="checkbox"
                      name="ids"
                      value={application.id}
                      form={bulkFormId}
                      className="accent-foreground"
                      aria-label={`Select ${application.user.name}`}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="font-semibold tracking-tight">
                        {application.user.handle ? (
                          <Link
                            href={`/u/${application.user.handle}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {application.user.name}
                          </Link>
                        ) : (
                          application.user.name
                        )}
                      </h2>
                      <StageBadge stage={application.status} />
                      {stale && (
                        <span className="font-mono text-xs text-muted-foreground uppercase">
                          Waiting {daysSince(application.appliedAt)} days
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[
                        profile?.headline,
                        profile?.experienceLevel &&
                          experienceLevelLabels[profile.experienceLevel],
                        profile?.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {profile?.skills.length ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {profile.skills.slice(0, 8).map((skill) => (
                          <li key={skill}>
                            <Badge variant="outline" className="font-normal">
                              {skill}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {application.note && (
                      <p className="mt-3 text-sm">&ldquo;{application.note}&rdquo;</p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Applied {formatDate(application.appliedAt)}
                      {application.reason && ` · last reason: “${application.reason}”`}
                    </p>
                  </div>
                  <div className="order-last flex basis-full items-baseline justify-between gap-4 border-t pt-4 sm:order-none sm:basis-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0 sm:text-right">
                    <p className="font-mono text-xs text-muted-foreground uppercase">
                      Skill score
                    </p>
                    <p className="text-3xl font-semibold tracking-tight tabular-nums">
                      {application.skillScore ?? "—"}
                    </p>
                    <Link
                      href={`/recruiter/jobs/${job.id}/submissions`}
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      See submissions
                    </Link>
                  </div>
                </div>
                <div className="border-t p-5 sm:p-6">
                  <StageForm
                    applicationId={application.id}
                    current={application.status}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function ApplicantsPage(props: ApplicantsPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Applicants {...props} />
    </Suspense>
  );
}
