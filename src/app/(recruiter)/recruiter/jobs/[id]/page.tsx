import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { closeJob, publishJob } from "@/features/jobs/actions";
import { RealityBadge } from "@/features/jobs/components/reality-badge";
import { RealityBreakdown } from "@/features/jobs/components/reality-breakdown";
import { getCompanyJob } from "@/features/jobs/queries";
import { formatDate, formatSalaryRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Manage role",
  robots: { index: false },
};

type ManageJobPageProps = PageProps<"/recruiter/jobs/[id]">;

async function ManageJob({ params }: Pick<ManageJobPageProps, "params">) {
  const account = await requireRole("recruiter");
  const job = account.company
    ? await getCompanyJob((await params).id, account.company.id)
    : null;
  if (!job) notFound();

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-8">
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All roles
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {job.status}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {job.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {formatSalaryRange(job.salaryMin, job.salaryMax)} · {job.location}
              {job.remote && " · Remote"} · closes {formatDate(job.deadline)}
            </p>
          </div>
          <RealityBadge score={job.realityScore} />
        </div>

        <div className="flex flex-wrap gap-3">
          {job.status !== "archived" && (
            <Button asChild variant="outline" className="h-11 px-5 text-sm">
              <Link href={`/recruiter/jobs/${job.id}/edit`}>Edit</Link>
            </Button>
          )}
          {(job.status === "draft" || job.status === "closed") && (
            <form action={publishJob}>
              <input type="hidden" name="jobId" value={job.id} />
              <Button type="submit" className="h-11 px-5 text-sm">
                {job.status === "draft" ? "Publish" : "Reopen"}
              </Button>
            </form>
          )}
          {job.status === "open" && (
            <>
              <Button asChild variant="ghost" className="h-11 px-4 text-sm">
                <Link href={`/jobs/${job.slug}`}>
                  View public page
                  <ExternalLink data-icon="inline-end" />
                </Link>
              </Button>
              <form action={closeJob}>
                <input type="hidden" name="jobId" value={job.id} />
                <Button type="submit" variant="outline" className="h-11 px-5 text-sm">
                  Close role
                </Button>
              </form>
            </>
          )}
        </div>

        <section>
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Description
          </h2>
          <div className="mt-4 text-[15px] leading-relaxed whitespace-pre-line">
            {job.description}
          </div>
        </section>

        <section>
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Skills
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <li key={skill}>
                <Badge variant="outline" className="font-normal">
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Reality Score
          </h2>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {job.realityScore ?? "—"}
            <span className="text-base text-muted-foreground"> / 100</span>
          </span>
        </div>
        <div className="mt-5">
          {job.realityBreakdown?.length ? (
            <RealityBreakdown signals={job.realityBreakdown} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Publish to get scored. Candidates see this breakdown on the public page.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function ManageJobPage({ params }: ManageJobPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ManageJob params={params} />
    </Suspense>
  );
}
