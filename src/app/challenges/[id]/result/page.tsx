import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { retryEvaluation } from "@/features/challenges/actions";
import { EvaluationSummary } from "@/features/challenges/components/evaluation-summary";
import { getChallenge, getSubmission } from "@/features/challenges/queries";

export const metadata: Metadata = {
  title: "Challenge result",
  robots: { index: false },
};

type ResultPageProps = PageProps<"/challenges/[id]/result">;

async function ChallengeResult({ params }: Pick<ResultPageProps, "params">) {
  await connection();
  const account = await requireRole("seeker");
  const challenge = await getChallenge((await params).id);
  if (!challenge) notFound();

  const submission = await getSubmission(challenge.id, account.id);
  if (!submission) redirect(`/jobs/${challenge.job.slug}/challenges`);
  if (submission.status === "started") redirect(`/challenges/${challenge.id}`);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {challenge.job.company.name} · {challenge.job.title} · {challenge.skill}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {challenge.title}
        </h1>
      </div>

      {submission.status === "evaluated" &&
      submission.score != null &&
      submission.breakdown ? (
        <EvaluationSummary
          score={submission.score}
          feedback={submission.feedback ?? ""}
          breakdown={submission.breakdown}
        />
      ) : submission.code ? (
        <div className="rounded-xl p-6 ring-1 ring-foreground/10">
          <p className="font-medium">Grading did not complete.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your answer is saved. The grader was unavailable for a moment, so run it
            again.
          </p>
          <form action={retryEvaluation} className="mt-4">
            <input type="hidden" name="challengeId" value={challenge.id} />
            <Button type="submit" className="h-11 px-5 text-sm">
              Grade again
            </Button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl p-6 ring-1 ring-foreground/10">
          <p className="font-medium">This attempt was closed without a submission.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Each challenge allows one attempt.
          </p>
        </div>
      )}

      {submission.code && (
        <details className="group rounded-xl ring-1 ring-foreground/10">
          <summary className="cursor-pointer px-5 py-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Your submission
          </summary>
          <pre className="overflow-auto border-t p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {submission.code}
          </pre>
        </details>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild className="h-11 px-5 text-sm">
          <Link href={`/jobs/${challenge.job.slug}/challenges`}>
            More challenges for this role
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        {account.handle && (
          <Button asChild variant="outline" className="h-11 px-5 text-sm">
            <Link href={`/u/${account.handle}`}>View your portfolio</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ResultPage({ params }: ResultPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ChallengeResult params={params} />
    </Suspense>
  );
}
