import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countWaitingApplicants } from "@/features/applications/queries";
import { ProfileCompletion } from "@/features/auth/components/profile-completion";
import { recruiterCompletion } from "@/features/auth/profile-completion";
import { requireRole } from "@/features/auth/queries";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const upcoming = [
  {
    phase: "03",
    title: "Skill challenges",
    body: "Each role gets AI-generated challenges so applicants arrive with proof, not claims.",
  },
  {
    phase: "04",
    title: "Ranked applicants",
    body: "Candidates sorted by verified skill score, with AI feedback attached.",
  },
  {
    phase: "06",
    title: "Reverse hiring",
    body: "Browse anonymous, proven candidates and invite them to interview.",
  },
];

async function RecruiterDashboard() {
  const account = await requireRole("recruiter");
  const company = account.company;
  const completion = recruiterCompletion(company);
  const waiting = company ? await countWaitingApplicants(company.id) : 0;

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Welcome
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {company?.name ?? account.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Signed in as {account.name}
          {waiting > 0 && (
            <>
              {" "}
              ·{" "}
              <span className="text-foreground">
                {waiting} applicant{waiting === 1 ? "" : "s"} waiting for a first response
              </span>
            </>
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="h-11 px-5 text-sm">
            <Link href="/recruiter/jobs/new">Post a role</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-5 text-sm">
            <Link href="/recruiter/jobs">Manage roles</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ProfileCompletion completion={completion} />

        <section
          aria-labelledby="company-heading"
          className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="company-heading"
              className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
            >
              Company
            </h2>
            {company?.verified ? (
              <Badge className="font-mono">Verified domain</Badge>
            ) : (
              <Badge variant="outline" className="font-mono">
                Unverified
              </Badge>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">
                Domain
              </dt>
              <dd className="mt-1 font-medium">{company?.domain ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">Size</dt>
              <dd className="mt-1 font-medium">
                {company?.size ? `${company.size} people` : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">
                Industry
              </dt>
              <dd className="mt-1 font-medium">{company?.industry ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">
                Response rate
              </dt>
              <dd className="mt-1 font-medium">No applicants yet</dd>
            </div>
          </dl>
          {!company?.verified && (
            <p className="mt-4 text-xs text-muted-foreground">
              Sign up with an email on your company domain to earn the verified mark. It
              adds 15 points to every Reality Score.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="upcoming-heading">
        <h2
          id="upcoming-heading"
          className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
        >
          Coming next
        </h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
          {upcoming.map((item) => (
            <article key={item.phase} className="flex flex-col gap-3 bg-background p-5">
              <span className="font-mono text-xs text-muted-foreground">
                {item.phase}
              </span>
              <h3 className="font-semibold tracking-tight">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RecruiterDashboard />
    </Suspense>
  );
}
