import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { requireRole } from "@/features/auth/queries";
import { getCompanyJob } from "@/features/jobs/queries";
import { BriefForm } from "@/features/talent/components/brief-form";

export const metadata: Metadata = {
  title: "New brief",
  robots: { index: false },
};

type NewBriefPageProps = PageProps<"/recruiter/jobs/[id]/challenges/new">;

async function NewBrief({ params }: Pick<NewBriefPageProps, "params">) {
  const account = await requireRole("recruiter");
  const job = account.company
    ? await getCompanyJob((await params).id, account.company.id)
    : null;
  if (!job || job.status === "archived") notFound();

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
          Challenge brief
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Post a real problem.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Candidates solve it under the same timer and grader as the generated challenges.
          Top solvers show up first in your submissions, ready to invite.
        </p>
      </div>
      <div className="mt-8">
        <BriefForm jobId={job.id} defaultSkill={job.skills[0] ?? ""} />
      </div>
    </>
  );
}

export default function NewBriefPage({ params }: NewBriefPageProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Suspense fallback={<DashboardSkeleton />}>
        <NewBrief params={params} />
      </Suspense>
    </div>
  );
}
