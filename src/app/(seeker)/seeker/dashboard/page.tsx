import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProfileCompletion } from "@/features/auth/components/profile-completion";
import { seekerCompletion } from "@/features/auth/profile-completion";
import { StageBadge } from "@/features/applications/components/stage-badge";
import { listSeekerApplications } from "@/features/applications/queries";
import { SkillScoreList } from "@/features/challenges/components/skill-score-list";
import { listUserSkillScores, listUserSubmissions } from "@/features/challenges/queries";
import { requireRole } from "@/features/auth/queries";
import { experienceLevelLabels } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const upcoming = [
  {
    phase: "08",
    title: "Launch polish",
    body: "Accessibility pass, performance budget and the public launch.",
  },
  {
    phase: "06",
    title: "Get discovered",
    body: "Companies browse verified candidates and invite them to interview.",
  },
  {
    phase: "07",
    title: "Interview prep",
    body: "Mock interviews built from the role, with feedback on every answer.",
  },
];

async function SeekerDashboard() {
  const account = await requireRole("seeker");
  const profile = account.seekerProfile;
  const completion = seekerCompletion(profile);
  const firstName = account.name.split(" ")[0];
  const [scores, recent, applications] = await Promise.all([
    listUserSkillScores(account.id),
    listUserSubmissions(account.id, 5),
    listSeekerApplications(account.id),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Welcome
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Hi, {firstName}.
        </h1>
        {profile?.headline && (
          <p className="mt-2 text-muted-foreground">{profile.headline}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="h-11 px-5 text-sm">
            <Link href="/jobs">Browse open roles</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-5 text-sm">
            <Link href="/seeker/coach">Ask the coach</Link>
          </Button>
          {account.handle && (
            <Button asChild variant="outline" className="h-11 px-5 text-sm">
              <Link href={`/u/${account.handle}`}>Public portfolio</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ProfileCompletion completion={completion} />

        <section
          aria-labelledby="skills-heading"
          className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="skills-heading"
              className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
            >
              Skills
            </h2>
            {profile?.experienceLevel && (
              <span className="text-sm text-muted-foreground">
                {experienceLevelLabels[profile.experienceLevel]}
              </span>
            )}
          </div>
          <div className="mt-4">
            <SkillScoreList scores={scores} claimed={profile?.skills ?? []} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Filled badges are verified by graded challenges. Outlined ones are still
            claims.
          </p>
        </section>
      </div>

      {applications.length > 0 && (
        <section aria-labelledby="applications-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="applications-heading"
              className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
            >
              Applications
            </h2>
            <Link
              href="/seeker/applications"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Track all
            </Link>
          </div>
          <ul className="mt-4 divide-y rounded-xl ring-1 ring-foreground/10">
            {applications.slice(0, 4).map((application) => (
              <li
                key={application.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{application.job.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {application.job.company.name}
                  </p>
                </div>
                <StageBadge stage={application.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2
            id="recent-heading"
            className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            Recent challenges
          </h2>
          <ul className="mt-4 divide-y rounded-xl ring-1 ring-foreground/10">
            {recent.map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <Link
                      href={
                        submission.status === "started"
                          ? `/challenges/${submission.challengeId}`
                          : `/challenges/${submission.challengeId}/result`
                      }
                      className="hover:underline"
                    >
                      {submission.challenge.title}
                    </Link>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {submission.challenge.job.title} · {submission.challenge.skill}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums">
                  {submission.status === "evaluated"
                    ? `${submission.score} / 100`
                    : submission.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

export default function SeekerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <SeekerDashboard />
    </Suspense>
  );
}
