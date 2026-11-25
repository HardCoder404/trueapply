import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/queries";
import { JobForm } from "@/features/jobs/components/job-form";
import { getCompanyJob } from "@/features/jobs/queries";

export const metadata: Metadata = {
  title: "Edit role",
  robots: { index: false },
};

type EditJobPageProps = PageProps<"/recruiter/jobs/[id]/edit">;

async function EditJobForm({ params }: Pick<EditJobPageProps, "params">) {
  const account = await requireRole("recruiter");
  const job = account.company
    ? await getCompanyJob((await params).id, account.company.id)
    : null;
  if (!job || job.status === "archived") notFound();

  return <JobForm job={job} />;
}

export default function EditJobPage({ params }: EditJobPageProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Edit role
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Update the posting.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Open roles are rescored when you save.
        </p>
      </div>

      <Suspense fallback={null}>
        <EditJobForm params={params} />
      </Suspense>
    </div>
  );
}
