import type { Metadata } from "next";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/queries";
import { JobForm } from "@/features/jobs/components/job-form";

export const metadata: Metadata = {
  title: "Post a role",
  robots: { index: false },
};

async function NewJobForm() {
  await requireRole("recruiter");
  return <JobForm />;
}

export default function NewJobPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          New role
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Post a role.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Salary range is required. On publish, the posting is scored and the breakdown is
          shown to every candidate.
        </p>
      </div>

      <Suspense fallback={null}>
        <NewJobForm />
      </Suspense>
    </div>
  );
}
