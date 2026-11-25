import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RealityBadge } from "@/features/jobs/components/reality-badge";
import { formatDate, formatSalaryRange } from "@/lib/format";

import { respondToInvite } from "../actions";
import type { listSeekerInvites } from "../queries";
import { declineReasons } from "../schemas";

type Invite = Awaited<ReturnType<typeof listSeekerInvites>>[number];

const statusCopy = {
  pending: "Awaiting your answer",
  accepted: "Accepted",
  declined: "Declined",
} as const;

export function InviteCard({ invite }: { invite: Invite }) {
  const pending = invite.status === "pending" && invite.job.status === "open";

  return (
    <li
      className={`rounded-xl ring-1 ${pending ? "ring-foreground/40" : "ring-foreground/10"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="font-semibold tracking-tight">
            <Link
              href={`/jobs/${invite.job.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {invite.job.title}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {invite.company.name}
            {invite.company.verified && " · verified domain"} · {invite.job.location}
            {invite.job.remote && " · Remote"} · {formatDate(invite.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RealityBadge score={invite.job.realityScore} />
          <Badge variant={pending ? "default" : "outline"} className="font-mono">
            {statusCopy[invite.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 border-t p-5 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-6">
        <div className="sm:w-44">
          <p className="font-mono text-xs text-muted-foreground uppercase">
            Offered range
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {formatSalaryRange(invite.salaryMin, invite.salaryMax)}
          </p>
          {invite.matchScore != null && (
            <p className="mt-2 font-mono text-xs text-muted-foreground uppercase">
              Match {invite.matchScore}/100
            </p>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase">
              Why they picked you
            </p>
            <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line">
              {invite.message}
            </p>
          </div>
          {invite.status === "declined" && invite.declineReason && (
            <p className="text-sm text-muted-foreground">
              You said: {invite.declineReason}
            </p>
          )}
          {invite.status === "accepted" && (
            <Button asChild variant="outline" className="h-11 px-4 text-sm">
              <Link href="/seeker/applications">Track the interview</Link>
            </Button>
          )}
          {pending && (
            <div className="flex flex-wrap items-start gap-3">
              <form action={respondToInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <input type="hidden" name="decision" value="accept" />
                <Button type="submit" className="h-11 px-5 text-sm">
                  Accept and reveal my profile
                </Button>
              </form>
              <details className="group">
                <summary className="inline-flex h-11 cursor-pointer list-none items-center rounded-lg border border-border px-4 text-sm transition-colors hover:border-foreground">
                  Decline
                </summary>
                <form action={respondToInvite} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <input type="hidden" name="decision" value="decline" />
                  <label className="sr-only" htmlFor={`reason-${invite.id}`}>
                    Reason
                  </label>
                  <select
                    id={`reason-${invite.id}`}
                    name="declineReason"
                    defaultValue={declineReasons[0]}
                    className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
                  >
                    {declineReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" className="h-11 px-4 text-sm">
                    Send decline
                  </Button>
                </form>
              </details>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
