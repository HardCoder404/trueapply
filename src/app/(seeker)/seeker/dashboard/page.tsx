import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";

import { Badge } from "@/components/ui/badge";
import { ProfileCompletion } from "@/features/auth/components/profile-completion";
import { seekerCompletion } from "@/features/auth/profile-completion";
import { requireRole } from "@/features/auth/queries";
import { experienceLevelLabels } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const upcoming = [
  {
    phase: "02",
    title: "Verified job board",
    body: "Every listing with a Reality Score and a visible salary.",
  },
  {
    phase: "03",
    title: "Skill challenges",
    body: "Short, role-specific tasks that turn your skill tags into scores.",
  },
  {
    phase: "04",
    title: "Live applications",
    body: "See exactly where each application sits, and how long it has sat there.",
  },
];

async function SeekerDashboard() {
  const account = await requireRole("seeker");
  const profile = account.seekerProfile;
  const completion = seekerCompletion(profile);
  const firstName = account.name.split(" ")[0];

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
          {profile?.skills.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="outline" className="h-7 px-3 font-normal">
                    {skill}
                    <span className="text-muted-foreground">· unverified</span>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No skills added yet.</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Tags are claims. Challenges turn them into verified scores in Phase 3.
          </p>
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

export default function SeekerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <SeekerDashboard />
    </Suspense>
  );
}
