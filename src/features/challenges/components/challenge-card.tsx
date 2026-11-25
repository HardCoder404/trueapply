import { Button } from "@/components/ui/button";

import { startChallenge } from "../actions";
import type { Challenge, Submission } from "../types";

const statusCopy = {
  started: "In progress",
  submitted: "Grading",
  evaluated: "Scored",
  failed: "Closed",
} as const;

export function ChallengeCard({
  challenge,
  submission,
}: {
  challenge: Challenge;
  submission?: Submission;
}) {
  return (
    <article className="flex flex-col gap-4 bg-background p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0 space-y-1.5">
        <p className="font-mono text-xs text-muted-foreground uppercase">
          {challenge.skill} · {challenge.difficulty} · {challenge.timeLimitMinutes} min
          {challenge.language && ` · ${challenge.language}`}
        </p>
        <h2 className="font-semibold tracking-tight">{challenge.title}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {challenge.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {submission?.status === "evaluated" && (
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {submission.score}
            <span className="text-sm text-muted-foreground"> / 100</span>
          </span>
        )}
        {submission ? (
          <Button asChild variant="outline" className="h-11 px-4 text-sm">
            <a
              href={
                submission.status === "started"
                  ? `/challenges/${challenge.id}`
                  : `/challenges/${challenge.id}/result`
              }
            >
              {submission.status === "started"
                ? "Continue"
                : statusCopy[submission.status]}
            </a>
          </Button>
        ) : (
          <form action={startChallenge}>
            <input type="hidden" name="challengeId" value={challenge.id} />
            <Button type="submit" className="h-11 px-4 text-sm">
              Start
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}
