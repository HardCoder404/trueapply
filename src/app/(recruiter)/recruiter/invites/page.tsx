import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { candidateLabel } from "@/features/talent/anonymous";
import { listCompanyInvites } from "@/features/talent/queries";
import { experienceLevelLabels } from "@/lib/constants";
import { formatDate, formatSalaryRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Invitations",
  robots: { index: false },
};

const statusCopy = {
  pending: "Waiting",
  accepted: "Accepted",
  declined: "Declined",
} as const;

async function Invites() {
  await connection();
  const account = await requireRole("recruiter");
  if (!account.company) return null;
  const rows = await listCompanyInvites(account.company.id);

  if (!rows.length) {
    return (
      <div className="rounded-xl p-10 text-center ring-1 ring-foreground/10">
        <p className="font-medium">No invitations sent yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the talent pool or open a role&apos;s matches to invite someone.
        </p>
        <Button asChild className="mt-6 h-11 px-5 text-sm">
          <Link href="/recruiter/talent">Browse talent</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((invite) => {
        const revealed = invite.status === "accepted";
        const profile = invite.user.seekerProfile;
        return (
          <li key={invite.id} className="rounded-xl ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0">
                <h2 className="font-semibold tracking-tight">
                  {revealed ? (
                    invite.user.handle ? (
                      <Link
                        href={`/u/${invite.user.handle}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {invite.user.name}
                      </Link>
                    ) : (
                      invite.user.name
                    )
                  ) : (
                    <Link
                      href={`/recruiter/talent/${invite.userId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {candidateLabel(invite.userId)}
                    </Link>
                  )}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[
                    profile?.experienceLevel &&
                      experienceLevelLabels[profile.experienceLevel],
                    profile?.location,
                    `for ${invite.job.title}`,
                    formatSalaryRange(invite.salaryMin, invite.salaryMax),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  {formatDate(invite.respondedAt ?? invite.createdAt)}
                </span>
                <Badge variant={revealed ? "default" : "outline"} className="font-mono">
                  {statusCopy[invite.status]}
                </Badge>
              </div>
            </div>
            {(invite.status === "declined" && invite.declineReason) || revealed ? (
              <div className="border-t p-5 text-sm sm:p-6">
                {revealed ? (
                  <p>
                    Identity revealed. They are at the Interview stage in{" "}
                    <Link
                      href={`/recruiter/jobs/${invite.job.id}/applicants`}
                      className="underline underline-offset-4"
                    >
                      the pipeline
                    </Link>
                    .
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Their reason: {invite.declineReason}
                  </p>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function RecruiterInvitesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Invitations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Who you reached out to.
          </h1>
        </div>
        <Button asChild variant="outline" className="h-11 px-4 text-sm">
          <Link href="/recruiter/talent">Browse talent</Link>
        </Button>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Invites />
      </Suspense>
    </div>
  );
}
