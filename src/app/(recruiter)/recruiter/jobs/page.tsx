import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { RealityBadge } from "@/features/jobs/components/reality-badge";
import { listCompanyJobs } from "@/features/jobs/queries";
import { formatDate, formatSalaryRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your roles",
  robots: { index: false },
};

const statusLabels = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Expired",
} as const;

async function CompanyJobs() {
  const account = await requireRole("recruiter");
  const jobs = account.company ? await listCompanyJobs(account.company.id) : [];

  if (!jobs.length) {
    return (
      <div className="rounded-xl p-10 text-center ring-1 ring-foreground/10">
        <p className="font-medium">You have not posted a role yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every posting is scored before it goes live, so candidates can trust it.
        </p>
        <Button asChild className="mt-6 h-11 px-5 text-sm">
          <Link href="/recruiter/jobs/new">Post your first role</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-px overflow-hidden rounded-xl bg-border">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="relative flex flex-wrap items-center justify-between gap-4 bg-background p-5 hover:bg-card"
        >
          <div className="min-w-0">
            <h2 className="truncate font-semibold tracking-tight">
              <Link
                href={`/recruiter/jobs/${job.id}`}
                className="after:absolute after:inset-0"
              >
                {job.title}
              </Link>
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatSalaryRange(job.salaryMin, job.salaryMax)} · {job.location} · closes{" "}
              {formatDate(job.deadline)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground uppercase">
              {statusLabels[job.status]}
            </span>
            <RealityBadge score={job.realityScore} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RecruiterJobsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Roles
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your postings
          </h1>
        </div>
        <Button asChild className="h-11 px-4 text-sm">
          <Link href="/recruiter/jobs/new">
            <Plus data-icon="inline-start" />
            Post a role
          </Link>
        </Button>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <CompanyJobs />
      </Suspense>
    </div>
  );
}
