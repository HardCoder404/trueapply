import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { requireRole } from "@/features/auth/queries";
import { EvaluationSummary } from "@/features/challenges/components/evaluation-summary";
import { IntegrityNote } from "@/features/challenges/components/integrity-note";
import { listJobSubmissions } from "@/features/challenges/queries";
import { getCompanyJob } from "@/features/jobs/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Submissions",
  robots: { index: false },
};

type SubmissionsPageProps = PageProps<"/recruiter/jobs/[id]/submissions">;

const statusCopy = {
  started: "In progress",
  submitted: "Grading",
  evaluated: "Scored",
  failed: "Closed",
} as const;

async function Submissions({ params }: Pick<SubmissionsPageProps, "params">) {
  await connection();
  const account = await requireRole("recruiter");
  const job = account.company
    ? await getCompanyJob((await params).id, account.company.id)
    : null;
  if (!job) notFound();

  const candidates = await listJobSubmissions(job.id);

  return (
    <>
      <Link
        href={`/recruiter/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {job.title}
      </Link>

      <div className="mt-6">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Submissions
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {candidates.length} candidate{candidates.length === 1 ? "" : "s"} tried this
          role.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Ranked by best score. Open a submission to read the code, the grader&apos;s
          notes and how the attempt went.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="mt-8 rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          No attempts yet. Share the public page to get candidates in.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {candidates.map(({ user, submissions }) => (
            <li key={user.id} className="rounded-xl ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b p-5">
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-tight">
                    {user.handle ? (
                      <Link
                        href={`/u/${user.handle}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {user.name}
                      </Link>
                    ) : (
                      user.name
                    )}
                  </h2>
                  {user.seekerProfile?.headline && (
                    <p className="text-sm text-muted-foreground">
                      {user.seekerProfile.headline}
                    </p>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground uppercase">
                  {submissions.filter((s) => s.status === "evaluated").length} /{" "}
                  {submissions.length} scored
                </p>
              </div>

              <ul className="divide-y">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 hover:bg-card">
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {submission.challenge.title}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            {submission.challenge.skill}
                            {!submission.challenge.active &&
                              " · retired challenge"} · {formatDate(submission.startedAt)}
                          </span>
                        </span>
                        <span className="flex items-center gap-4">
                          <IntegrityNote integrity={submission.integrity} compact />
                          <span className="font-mono text-sm tabular-nums">
                            {submission.status === "evaluated"
                              ? `${submission.score} / 100`
                              : statusCopy[submission.status]}
                          </span>
                        </span>
                      </summary>

                      <div className="space-y-6 border-t bg-card/50 p-5">
                        {submission.status === "evaluated" &&
                        submission.score != null &&
                        submission.breakdown ? (
                          <EvaluationSummary
                            score={submission.score}
                            feedback={submission.feedback ?? ""}
                            breakdown={submission.breakdown}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {submission.code
                              ? "Submitted, grading did not complete."
                              : "No answer was submitted."}
                          </p>
                        )}

                        <IntegrityNote integrity={submission.integrity} />

                        {submission.code && (
                          <div>
                            <h3 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                              Submission
                            </h3>
                            <pre className="mt-2 max-h-[32rem] overflow-auto rounded-lg bg-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap ring-1 ring-foreground/10">
                              {submission.code}
                            </pre>
                          </div>
                        )}
                        {submission.runOutput && (
                          <div>
                            <h3 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                              Run output
                            </h3>
                            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap ring-1 ring-foreground/10">
                              {submission.runOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function SubmissionsPage({ params }: SubmissionsPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Submissions params={params} />
    </Suspense>
  );
}
