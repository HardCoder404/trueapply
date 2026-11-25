import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { LiveRefresh } from "@/features/applications/components/live-refresh";
import { StageBadge } from "@/features/applications/components/stage-badge";
import { Timeline } from "@/features/applications/components/timeline";
import {
  listSeekerApplications,
  seekerApplicationsVersion,
} from "@/features/applications/queries";
import { requireRole } from "@/features/auth/queries";
import { recruiterResponseWindowDays } from "@/lib/constants";
import { daysSince, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your applications",
  robots: { index: false },
};

async function Applications() {
  await connection();
  const account = await requireRole("seeker");
  const [rows, version] = await Promise.all([
    listSeekerApplications(account.id),
    seekerApplicationsVersion(account.id),
  ]);

  if (!rows.length) {
    return (
      <div className="rounded-xl p-10 text-center ring-1 ring-foreground/10">
        <p className="font-medium">No applications yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Take a role&apos;s challenges, then apply with the score.
        </p>
        <Button asChild className="mt-6 h-11 px-5 text-sm">
          <Link href="/jobs">Browse open roles</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <LiveRefresh version={version} />
      <ul className="space-y-4">
        {rows.map((application) => {
          const waiting = daysSince(application.stageChangedAt);
          const open =
            application.status !== "rejected" && application.status !== "offered";
          return (
            <li key={application.id} className="rounded-xl ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-tight">
                    <Link
                      href={`/jobs/${application.job.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {application.job.title}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {application.job.company.name} · applied{" "}
                    {formatDate(application.appliedAt)}
                    {application.skillScore != null &&
                      ` · score ${application.skillScore}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StageBadge stage={application.status} />
                </div>
              </div>

              <div className="grid gap-4 border-t p-5 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-6">
                <div className="sm:w-44">
                  <p className="font-mono text-xs text-muted-foreground uppercase">
                    {open ? "Since last update" : "Closed after"}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                    {waiting}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      day{waiting === 1 ? "" : "s"}
                    </span>
                  </p>
                  {open && waiting >= recruiterResponseWindowDays && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Past the {recruiterResponseWindowDays}-day window. This company is
                      marked as a slow responder.
                    </p>
                  )}
                </div>
                <Timeline events={application.events} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function ApplicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Applications
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Where each one stands.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Updates land here live, with the reason the company gave. No black holes.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Applications />
      </Suspense>
    </div>
  );
}
