import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { auth } from "@clerk/nextjs/server";

import { ResponseBadge } from "@/features/applications/components/response-badge";
import { StageBadge } from "@/features/applications/components/stage-badge";
import { companyResponseStats, getApplication } from "@/features/applications/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RealityBadge } from "@/features/jobs/components/reality-badge";
import { RealityBreakdown } from "@/features/jobs/components/reality-breakdown";
import { getOpenJobBySlug } from "@/features/jobs/queries";
import type { JobWithCompany } from "@/features/jobs/types";
import { siteConfig } from "@/lib/constants";
import { daysBetween, formatDate, formatSalaryRange } from "@/lib/format";

type JobPageProps = PageProps<"/jobs/[slug]">;

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  await connection();
  const job = await getOpenJobBySlug((await params).slug);
  if (!job) return { title: "Role not found" };

  const title = `${job.title} at ${job.company.name}`;
  const description = `${formatSalaryRange(job.salaryMin, job.salaryMax)} · ${job.location}${job.remote ? " · Remote" : ""}. ${job.description.slice(0, 140).trim()}…`;

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title, description, type: "article" },
  };
}

function jobPostingJsonLd(job: JobWithCompany) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    validThrough: job.deadline.toISOString(),
    employmentType: "FULL_TIME",
    identifier: { "@type": "PropertyValue", name: siteConfig.name, value: job.id },
    url: `${siteUrl}/jobs/${job.slug}`,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.domain && { sameAs: `https://${job.company.domain}` }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IN",
      },
    },
    ...(job.remote && { jobLocationType: "TELECOMMUTE" }),
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    },
    skills: job.skills.join(", "),
  };
}

async function JobDetail({ params }: Pick<JobPageProps, "params">) {
  await connection();
  const job = await getOpenJobBySlug((await params).slug);
  if (!job) notFound();

  const daysLeft = daysBetween(new Date(), job.deadline);
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  const [response, application] = await Promise.all([
    companyResponseStats([job.companyId]).then((stats) => stats.get(job.companyId)),
    account?.role === "seeker" ? getApplication(job.id, account.id) : null,
  ]);

  return (
    <article className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }}
      />

      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All roles
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {job.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {job.company.name} · {job.location}
              {job.remote && " · Remote friendly"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RealityBadge score={job.realityScore} />
            <ResponseBadge stats={response} />
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">Salary</dt>
            <dd className="mt-1 font-medium">
              {formatSalaryRange(job.salaryMin, job.salaryMax)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Deadline
            </dt>
            <dd className="mt-1 font-medium">
              {formatDate(job.deadline)}
              <span className="text-muted-foreground"> · {daysLeft}d</span>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Company domain
            </dt>
            <dd className="mt-1 font-medium">
              {job.company.verified ? "Verified" : "Unverified"}
            </dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            About the role
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed whitespace-pre-line">
            {job.description}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Skills you will be challenged on
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <li key={skill}>
                <Badge variant="outline" className="h-7 px-3 font-normal">
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          {application ? (
            <div className="flex flex-wrap items-center gap-3">
              <StageBadge stage={application.status} />
              <Button asChild variant="outline" className="h-11 px-5 text-sm">
                <Link href="/seeker/applications">Track your application</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button asChild className="h-11 px-5 text-sm">
                <Link href={`/jobs/${job.slug}/challenges`}>Take the challenges</Link>
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Timed work samples graded on the spot. Apply with the score once one is
                graded.
              </p>
            </>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6 lg:sticky lg:top-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Reality Score
          </h2>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {job.realityScore ?? "—"}
            <span className="text-base text-muted-foreground"> / 100</span>
          </span>
        </div>
        <div className="mt-5">
          {job.realityBreakdown?.length ? (
            <RealityBreakdown signals={job.realityBreakdown} />
          ) : (
            <p className="text-sm text-muted-foreground">
              This role has not been scored yet.
            </p>
          )}
        </div>
      </aside>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden className="space-y-4 motion-safe:animate-pulse">
      <div className="h-4 w-20 rounded bg-muted" />
      <div className="h-10 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-24 rounded-xl bg-card ring-1 ring-foreground/10" />
    </div>
  );
}

export default function JobPage({ params }: JobPageProps) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <JobDetail params={params} />
    </Suspense>
  );
}
