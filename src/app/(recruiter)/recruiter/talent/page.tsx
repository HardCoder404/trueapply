import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { CandidateCard } from "@/features/talent/components/candidate-card";
import { TalentFiltersForm } from "@/features/talent/components/talent-filters";
import { listTalent } from "@/features/talent/queries";
import { talentFiltersSchema } from "@/features/talent/schemas";

export const metadata: Metadata = {
  title: "Talent pool",
  robots: { index: false },
};

type TalentPageProps = PageProps<"/recruiter/talent">;

function pageHref(params: Record<string, string | number | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "" && key !== "page") query.set(key, String(value));
  }
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return `/recruiter/talent${qs ? `?${qs}` : ""}`;
}

async function Talent({ searchParams }: Pick<TalentPageProps, "searchParams">) {
  await connection();
  const account = await requireRole("recruiter");
  if (!account.company) return null;

  const parsed = talentFiltersSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const { items, hasMore, page } = await listTalent(filters, account.company.id);

  return (
    <>
      <TalentFiltersForm filters={filters} />
      {items.length === 0 ? (
        <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          No candidates match. Only seekers with at least one graded challenge appear
          here, so loosen the score or skill filter.
        </p>
      ) : (
        <>
          <ul className="grid gap-px overflow-hidden rounded-xl bg-border md:grid-cols-2">
            {items.map((candidate) => (
              <li key={candidate.id} className="flex">
                <div className="flex-1">
                  <CandidateCard candidate={candidate} />
                </div>
              </li>
            ))}
          </ul>
          {(page > 1 || hasMore) && (
            <nav aria-label="Pages" className="flex items-center justify-between">
              {page > 1 ? (
                <Button asChild variant="outline" className="h-11 px-4 text-sm">
                  <Link href={pageHref(filters, page - 1)}>Previous</Link>
                </Button>
              ) : (
                <span />
              )}
              {hasMore && (
                <Button asChild variant="outline" className="h-11 px-4 text-sm">
                  <Link href={pageHref(filters, page + 1)}>Next</Link>
                </Button>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}

export default function TalentPage({ searchParams }: TalentPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Talent pool
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Proven candidates, names hidden.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Everyone here passed a graded challenge. You see scores, level and what they
          want next. Their name appears only when they accept your invitation.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Talent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
