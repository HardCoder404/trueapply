import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { getCompanyJob } from "@/features/jobs/queries";
import { rankCandidates } from "@/features/talent/actions";
import { MatchFactors } from "@/features/talent/components/match-factors";
import { listJobInvites, listJobMatches } from "@/features/talent/queries";
import { experienceLevelLabels } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Matches",
  robots: { index: false },
};

type MatchesPageProps = PageProps<"/recruiter/jobs/[id]/matches">;

async function Matches({ params }: Pick<MatchesPageProps, "params">) {
  await connection();
  const account = await requireRole("recruiter");
  const job = account.company
    ? await getCompanyJob((await params).id, account.company.id)
    : null;
  if (!job) notFound();

  const [matches, invites] = await Promise.all([
    listJobMatches(job.id),
    listJobInvites(job.id),
  ]);
  const inviteBy = new Map(invites.map((i) => [i.userId, i.status]));
  const computedAt = matches[0]?.computedAt ?? null;

  return (
    <>
      <Link
        href={`/recruiter/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {job.title}
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Matches
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {matches.length
              ? `${matches.length} proven candidate${matches.length === 1 ? "" : "s"} for this role.`
              : "Find candidates who already proved it."}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Ranked by verified skill match, challenge performance and where they are
            headed. Nobody here has applied yet. Names stay hidden until they accept an
            invitation.
          </p>
        </div>
        <form action={rankCandidates}>
          <input type="hidden" name="jobId" value={job.id} />
          <Button
            type="submit"
            variant={matches.length ? "outline" : "default"}
            className="h-11 px-5 text-sm"
          >
            {matches.length ? "Refresh ranking" : "Rank candidates"}
          </Button>
          {computedAt && (
            <p className="mt-2 text-right font-mono text-[11px] text-muted-foreground uppercase">
              Ranked {formatDate(computedAt)}
            </p>
          )}
        </form>
      </div>

      {matches.length === 0 ? (
        <p className="mt-8 rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Press Rank candidates. It compares every discoverable seeker with graded skills
          against this role and explains the top fits.
        </p>
      ) : (
        <ol className="mt-8 space-y-4">
          {matches.map((match, index) => {
            const status = inviteBy.get(match.userId);
            return (
              <li key={match.id} className="rounded-xl ring-1 ring-foreground/10">
                <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
                  <span className="font-mono text-sm text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <div>
                        <h2 className="font-semibold tracking-tight">
                          <Link
                            href={`/recruiter/talent/${match.userId}?job=${job.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {match.label}
                          </Link>
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {[
                            match.profile?.experienceLevel &&
                              experienceLevelLabels[match.profile.experienceLevel],
                            match.profile?.location,
                            match.profile?.preferredRoles.length
                              ? `wants ${match.profile.preferredRoles.slice(0, 2).join(", ")}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <p className="font-mono text-2xl font-semibold tabular-nums">
                        {match.score}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          /100
                        </span>
                      </p>
                    </div>

                    <MatchFactors factors={match} />

                    {match.reasoning && (
                      <p className="text-[15px] leading-relaxed">{match.reasoning}</p>
                    )}

                    <ul className="flex flex-wrap gap-1.5">
                      {match.verified.slice(0, 6).map((skill) => (
                        <li key={skill.skill}>
                          <Badge className="gap-1.5 font-normal">
                            {skill.skill}
                            <span className="font-mono tabular-nums opacity-70">
                              {skill.score}
                            </span>
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="basis-full sm:basis-auto">
                    {status ? (
                      <Badge variant="outline" className="h-9 px-3 font-mono">
                        {status === "pending"
                          ? "Invited"
                          : status === "accepted"
                            ? "Accepted"
                            : "Declined"}
                      </Badge>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="h-11 w-full px-4 text-sm sm:w-auto"
                      >
                        <Link href={`/recruiter/talent/${match.userId}?job=${job.id}`}>
                          Invite to interview
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

export default function MatchesPage({ params }: MatchesPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Matches params={params} />
    </Suspense>
  );
}
