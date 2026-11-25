import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { daysBetween, formatSalaryRange } from "@/lib/format";

import type { JobWithCompany } from "../types";
import { RealityBadge } from "./reality-badge";

export function JobCard({ job }: { job: JobWithCompany }) {
  const daysLeft = daysBetween(new Date(), job.deadline);

  return (
    <article className="group relative flex flex-col gap-4 bg-background p-5 transition-colors hover:bg-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold tracking-tight">
            <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {job.company.name} · {job.location}
            {job.remote && " · Remote"}
          </p>
        </div>
        <RealityBadge score={job.realityScore} className="shrink-0" />
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Salary</dt>
          <dd className="font-medium">
            {formatSalaryRange(job.salaryMin, job.salaryMax)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Closes</dt>
          <dd className="font-medium">
            in {daysLeft} day{daysLeft === 1 ? "" : "s"}
          </dd>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 5).map((skill) => (
          <li key={skill}>
            <Badge variant="outline" className="font-normal">
              {skill}
            </Badge>
          </li>
        ))}
        {job.skills.length > 5 && (
          <li className="self-center text-xs text-muted-foreground">
            +{job.skills.length - 5}
          </li>
        )}
      </ul>
    </article>
  );
}
