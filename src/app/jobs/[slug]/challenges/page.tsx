import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/features/applications/components/stage-badge";
import { getApplication } from "@/features/applications/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { ChallengeCard } from "@/features/challenges/components/challenge-card";
import { submissionsForJob } from "@/features/challenges/queries";
import { getOpenJobBySlug } from "@/features/jobs/queries";

export const metadata: Metadata = {
  title: "Challenges",
  robots: { index: false },
};

type ChallengesPageProps = PageProps<"/jobs/[slug]/challenges">;

async function JobChallenges({ params }: Pick<ChallengesPageProps, "params">) {
  await connection();
  const { slug } = await params;
  const job = await getOpenJobBySlug(slug);
  if (!job) notFound();

  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated)
    return redirectToSignIn({ returnBackUrl: `/jobs/${slug}/challenges` });

  const account = await getCurrentUser();
  if (!account) redirect("/onboarding");

  if (account.role !== "seeker") {
    return (
      <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        Challenges are for job seekers. You are signed in as a recruiter.
      </p>
    );
  }

  const [{ challenges, byChallenge }, application] = await Promise.all([
    submissionsForJob(job.id, account.id),
    getApplication(job.id, account.id),
  ]);
  const scored = challenges.filter(
    (c) => byChallenge.get(c.id)?.status === "evaluated",
  ).length;

  return (
    <>
      <Link
        href={`/jobs/${job.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to the role
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {job.company.name} · {job.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Prove it, then apply.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Short work samples built from this role. Each one is graded on the spot and
            adds a verified score to your portfolio.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground uppercase">
          {scored} / {challenges.length} scored
        </p>
      </div>

      {(scored > 0 || application) && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          {application ? (
            <>
              <StageBadge stage={application.status} />
              <p className="text-sm text-muted-foreground">
                You applied with a score of {application.skillScore ?? "—"}.
              </p>
              <Button asChild variant="outline" className="ml-auto h-11 px-5 text-sm">
                <Link href="/seeker/applications">Track it</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">
                <span className="font-medium">{scored} graded.</span>{" "}
                <span className="text-muted-foreground">
                  You can apply now, or do more to raise the score.
                </span>
              </p>
              <Button asChild className="ml-auto h-11 px-5 text-sm">
                <Link href={`/jobs/${job.slug}/apply`}>Apply with your score</Link>
              </Button>
            </>
          )}
        </div>
      )}

      {challenges.length ? (
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl bg-border">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              submission={byChallenge.get(challenge.id)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          The company has not generated challenges for this role yet. Check back soon.
        </p>
      )}
    </>
  );
}

export default function ChallengesPage({ params }: ChallengesPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <JobChallenges params={params} />
    </Suspense>
  );
}
