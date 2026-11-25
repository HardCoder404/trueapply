import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { SkillScoreList } from "@/features/challenges/components/skill-score-list";
import { getPortfolio } from "@/features/challenges/queries";
import { experienceLevelLabels, siteConfig } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type PortfolioPageProps = PageProps<"/u/[handle]">;

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  await connection();
  const portfolio = await getPortfolio((await params).handle);
  if (!portfolio) return { title: "Profile not found" };

  const verified = portfolio.skillScores.length;
  return {
    title: `${portfolio.name} · verified skills`,
    description: `${portfolio.seekerProfile?.headline ?? "Job seeker"} with ${verified} verified skill${verified === 1 ? "" : "s"} on ${siteConfig.name}.`,
    alternates: { canonical: `/u/${portfolio.handle}` },
  };
}

async function Portfolio({ params }: Pick<PortfolioPageProps, "params">) {
  await connection();
  const portfolio = await getPortfolio((await params).handle);
  if (!portfolio) notFound();

  const profile = portfolio.seekerProfile;
  const latest = portfolio.skillScores[0];

  return (
    <article className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Skill portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {portfolio.name}
        </h1>
        {profile?.headline && (
          <p className="mt-2 text-lg text-muted-foreground">{profile.headline}</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {[
            profile?.location,
            profile?.experienceLevel && experienceLevelLabels[profile.experienceLevel],
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <section className="mt-10">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Verified skills
          </h2>
          <div className="mt-4">
            <SkillScoreList
              scores={portfolio.skillScores}
              claimed={profile?.skills ?? []}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Filled badges are graded work samples. Outlined ones are self-reported.
          </p>
        </section>

        {profile?.bio && (
          <section className="mt-10">
            <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              About
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </section>
        )}
      </div>

      <aside className="h-fit rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <dl className="grid grid-cols-2 gap-5 text-sm">
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Verified skills
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {portfolio.skillScores.length}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Challenges graded
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {portfolio.evaluatedCount}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-mono text-xs text-muted-foreground uppercase">
              Last verified
            </dt>
            <dd className="mt-1 font-medium">
              {latest ? formatDate(latest.verifiedAt) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Scores come from timed, one-attempt work samples graded against a rubric.
          Companies on {siteConfig.name} see the same numbers.
        </p>
      </aside>
    </article>
  );
}

export default function PortfolioPage({ params }: PortfolioPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Portfolio params={params} />
    </Suspense>
  );
}
