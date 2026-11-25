import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { companyResponseStats } from "@/features/applications/queries";
import { JobCard } from "@/features/jobs/components/job-card";
import { JobFiltersForm } from "@/features/jobs/components/job-filters";
import { listOpenJobs } from "@/features/jobs/queries";
import { jobFiltersSchema } from "@/features/jobs/schemas";

export const metadata: Metadata = {
  title: "Open roles with a Reality Score",
  description:
    "Every role on TrueApply shows its salary and a Reality Score, so you never apply into a black hole.",
  alternates: { canonical: "/jobs" },
};

type JobsPageProps = PageProps<"/jobs">;

async function JobResults({ searchParams }: Pick<JobsPageProps, "searchParams">) {
  await connection();
  const parsed = jobFiltersSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const { jobs, total, page, pages } = await listOpenJobs(filters);
  const responses = await companyResponseStats([
    ...new Set(jobs.map((job) => job.companyId)),
  ]);

  return (
    <>
      <JobFiltersForm filters={filters} />

      <p
        className="mt-6 font-mono text-xs text-muted-foreground uppercase"
        aria-live="polite"
      >
        {total} open role{total === 1 ? "" : "s"}
      </p>

      {jobs.length ? (
        <div className="mt-3 grid gap-px overflow-hidden rounded-xl bg-border">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} response={responses.get(job.companyId)} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl p-10 text-center ring-1 ring-foreground/10">
          <p className="font-medium">Nothing matches those filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a broader search, or{" "}
            <Link href="/jobs" className="underline underline-offset-4">
              clear the filters
            </Link>
            .
          </p>
        </div>
      )}

      {pages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex items-center justify-between font-mono text-xs"
        >
          <PageLink filters={filters} page={page - 1} disabled={page <= 1}>
            Previous
          </PageLink>
          <span className="text-muted-foreground">
            {page} / {pages}
          </span>
          <PageLink filters={filters} page={page + 1} disabled={page >= pages}>
            Next
          </PageLink>
        </nav>
      )}
    </>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: Record<string, string | number | undefined>;
  page: number;
  disabled: boolean;
  children: string;
}) {
  if (disabled) return <span className="text-muted-foreground/50">{children}</span>;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, page })) {
    if (value != null) params.set(key, String(value));
  }
  return (
    <Link href={`/jobs?${params}`} className="underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-hidden className="space-y-3 motion-safe:animate-pulse">
      <div className="h-11 rounded-lg bg-muted" />
      <div className="h-32 rounded-xl bg-card ring-1 ring-foreground/10" />
      <div className="h-32 rounded-xl bg-card ring-1 ring-foreground/10" />
    </div>
  );
}

export default function JobsPage({ searchParams }: JobsPageProps) {
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Job board
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Open roles, scored for realness.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Salary is always shown. Every listing carries a Reality Score built from signals
          the company cannot fake.
        </p>
      </div>

      <Suspense fallback={<ResultsSkeleton />}>
        <JobResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}
