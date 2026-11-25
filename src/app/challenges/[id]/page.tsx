import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { abandonChallenge } from "@/features/challenges/actions";
import { ChallengeTimer } from "@/features/challenges/components/challenge-timer";
import { SubmissionForm } from "@/features/challenges/components/submission-form";
import { getChallenge, getSubmission } from "@/features/challenges/queries";

export const metadata: Metadata = {
  title: "Challenge",
  robots: { index: false },
};

type TakeChallengePageProps = PageProps<"/challenges/[id]">;

async function TakeChallenge({ params }: Pick<TakeChallengePageProps, "params">) {
  await connection();
  const account = await requireRole("seeker");
  const challenge = await getChallenge((await params).id);
  if (!challenge) notFound();

  const submission = await getSubmission(challenge.id, account.id);
  if (!submission) redirect(`/jobs/${challenge.job.slug}/challenges`);
  if (submission.status !== "started") redirect(`/challenges/${challenge.id}/result`);

  const endsAt = new Date(
    submission.startedAt.getTime() + challenge.timeLimitMinutes * 60_000,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            <Link href={`/jobs/${challenge.job.slug}`} className="hover:text-foreground">
              {challenge.job.company.name} · {challenge.job.title}
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {challenge.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{challenge.skill}</span>
            <span>{challenge.difficulty}</span>
            <span>{challenge.timeLimitMinutes} min</span>
            <span className="inline-flex items-center gap-2 text-foreground">
              Time left <ChallengeTimer endsAt={endsAt.toISOString()} />
            </span>
          </div>
        </div>

        <div className="text-[15px] leading-relaxed whitespace-pre-line">
          {challenge.description}
        </div>

        <div>
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Graded on
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {challenge.rubric.map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-2 size-1 shrink-0 rounded-full bg-foreground"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form action={abandonChallenge}>
          <input type="hidden" name="challengeId" value={challenge.id} />
          <Button
            type="submit"
            variant="ghost"
            className="h-9 px-3 text-xs text-muted-foreground"
          >
            Give up this attempt
          </Button>
        </form>
      </div>

      <SubmissionForm
        challengeId={challenge.id}
        language={challenge.language}
        starterCode={challenge.starterCode}
      />
    </div>
  );
}

export default function TakeChallengePage({ params }: TakeChallengePageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TakeChallenge params={params} />
    </Suspense>
  );
}
