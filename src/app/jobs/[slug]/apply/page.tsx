import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { ApplyForm } from "@/features/applications/components/apply-form";
import { StageBadge } from "@/features/applications/components/stage-badge";
import { getApplication, jobSkillScore } from "@/features/applications/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { getOpenJobBySlug } from "@/features/jobs/queries";

export const metadata: Metadata = {
  title: "Apply",
  robots: { index: false },
};

type ApplyPageProps = PageProps<"/jobs/[slug]/apply">;

async function Apply({ params }: Pick<ApplyPageProps, "params">) {
  await connection();
  const { slug } = await params;
  const job = await getOpenJobBySlug(slug);
  if (!job) notFound();

  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn({ returnBackUrl: `/jobs/${slug}/apply` });
  const account = await getCurrentUser();
  if (!account) redirect("/onboarding");
  if (account.role !== "seeker") {
    return (
      <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        Only job seekers can apply.
      </p>
    );
  }

  const [existing, { score, challenges }] = await Promise.all([
    getApplication(job.id, account.id),
    jobSkillScore(job.id, account.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={`/jobs/${job.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {job.title}
      </Link>

      <p className="mt-6 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {job.company.name} · {job.title}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {existing ? "You have applied." : "Apply with your score."}
      </h1>

      {existing ? (
        <div className="mt-8 rounded-xl p-6 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StageBadge stage={existing.status} />
            <span className="font-mono text-sm tabular-nums">
              Skill score {existing.skillScore ?? "—"}
            </span>
          </div>
          <Button asChild variant="outline" className="mt-6 h-11 px-5 text-sm">
            <Link href="/seeker/applications">Track this application</Link>
          </Button>
        </div>
      ) : challenges.length === 0 ? (
        <div className="mt-8 rounded-xl p-6 ring-1 ring-foreground/10">
          <p className="font-medium">Complete a challenge first.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Applications here carry a verified score, so at least one graded challenge for
            this role is required.
          </p>
          <Button asChild className="mt-6 h-11 px-5 text-sm">
            <Link href={`/jobs/${job.slug}/challenges`}>See the challenges</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Your verified score
              </h2>
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {score}
                <span className="text-base text-muted-foreground"> / 100</span>
              </span>
            </div>
            <ul className="mt-4 divide-y text-sm">
              {challenges.map((challenge) => (
                <li
                  key={challenge.title}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{challenge.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {challenge.skill}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">{challenge.score}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              The company sees this score, each submission and the grader&apos;s notes.
              Nothing else is needed.
            </p>
          </div>

          <div className="mt-8">
            <ApplyForm slug={job.slug} />
          </div>
        </>
      )}
    </div>
  );
}

export default function ApplyPage({ params }: ApplyPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Apply params={params} />
    </Suspense>
  );
}
