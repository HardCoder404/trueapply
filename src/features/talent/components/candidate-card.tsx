import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { experienceLevelLabels } from "@/lib/constants";

import type { TalentRow } from "../queries";

export function CandidateCard({
  candidate,
  jobId,
}: {
  candidate: TalentRow;
  jobId?: string;
}) {
  const invited = candidate.inviteStatuses.length > 0;
  const href = `/recruiter/talent/${candidate.id}${jobId ? `?job=${jobId}` : ""}`;

  return (
    <article className="relative flex flex-col gap-4 bg-background p-5 transition-colors hover:bg-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold tracking-tight">
            <Link href={href} className="after:absolute after:inset-0">
              {candidate.label}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[
              candidate.level && experienceLevelLabels[candidate.level],
              candidate.location,
              candidate.preferredRoles.length
                ? `wants ${candidate.preferredRoles.slice(0, 2).join(", ")}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {candidate.average}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground uppercase">
            avg verified
          </span>
        </div>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {candidate.verified.slice(0, 6).map((skill) => (
          <li key={skill.skill}>
            <Badge className="gap-1.5 font-normal">
              {skill.skill}
              <span className="font-mono tabular-nums opacity-70">{skill.score}</span>
            </Badge>
          </li>
        ))}
        {candidate.claimed.slice(0, 4).map((skill) => (
          <li key={skill}>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {skill}
            </Badge>
          </li>
        ))}
      </ul>

      <p className="flex flex-wrap gap-x-4 font-mono text-xs text-muted-foreground uppercase">
        <span>
          {candidate.graded} challenge{candidate.graded === 1 ? "" : "s"} graded
        </span>
        {invited && <span>Invited</span>}
      </p>
    </article>
  );
}
