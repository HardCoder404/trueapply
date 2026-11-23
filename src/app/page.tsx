import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/constants";

const pillars = [
  {
    index: "01",
    title: "True jobs",
    body: "Every posting gets a Reality Score. Salary is mandatory, domains are verified, and ghost listings get flagged before anyone wastes a weekend on them.",
  },
  {
    index: "02",
    title: "True skills",
    body: "No resume keyword games. Candidates take short, role-specific challenges and walk away with a verified score they actually own.",
  },
  {
    index: "03",
    title: "True hiring",
    body: "A pipeline both sides can see. Recruiters must respond within seven days or wear a Slow Responder badge on every listing.",
  },
];

const sampleJob = {
  title: "Senior Frontend Engineer",
  company: "Northwind Labs",
  location: "Bengaluru · Remote-friendly",
  salary: "₹28L – ₹36L",
  score: 92,
  signals: ["Salary disclosed", "Verified domain", "Replies in 2 days"],
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10">
            <div className="max-w-2xl">
              <Reveal>
                <p className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
                  </span>
                  {siteConfig.tagline}
                </p>
              </Reveal>

              <Reveal delay={0.08}>
                <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.25rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance">
                  Hiring where nobody has to take your word for it.
                </h1>
              </Reveal>

              <Reveal delay={0.16}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Candidates prove skills through real challenges, not resumes. Companies
                  prove their roles are real, not ghost posts. AI sits in the middle and
                  keeps both sides honest.
                </p>
              </Reveal>

              <Reveal delay={0.24} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 px-5 text-sm">
                  <Link href="/register?role=seeker">
                    Find a real job
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 px-5 text-sm">
                  <Link href="/register?role=recruiter">Post a verified role</Link>
                </Button>
              </Reveal>
            </div>

            <Reveal delay={0.3} className="lg:justify-self-end">
              <Card className="w-full max-w-md gap-0 py-0 ring-foreground/15">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{sampleJob.title}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {sampleJob.company} · {sampleJob.location}
                      </p>
                    </div>
                    <Badge className="shrink-0 font-mono">Verified</Badge>
                  </div>

                  <Separator />

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-mono text-xs text-muted-foreground uppercase">
                        Salary
                      </dt>
                      <dd className="mt-1 font-medium">{sampleJob.salary}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs text-muted-foreground uppercase">
                        Reality score
                      </dt>
                      <dd className="mt-1 flex items-baseline gap-1 font-medium">
                        <span className="text-2xl leading-none tracking-tight">
                          {sampleJob.score}
                        </span>
                        <span className="text-muted-foreground">/ 100</span>
                      </dd>
                    </div>
                  </dl>

                  <div
                    role="img"
                    aria-label={`Reality score ${sampleJob.score} out of 100`}
                    className="h-1 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${sampleJob.score}%` }}
                    />
                  </div>

                  <ul className="flex flex-wrap gap-2">
                    {sampleJob.signals.map((signal) => (
                      <li key={signal}>
                        <Badge variant="outline" className="font-normal">
                          {signal}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
        >
          <h2
            id="how-it-works-heading"
            className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            How it works
          </h2>

          <div className="mt-8 grid gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.index}
                className="flex flex-col gap-4 bg-background p-6 sm:p-7"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {pillar.index}
                </span>
                <h3 className="text-xl font-semibold tracking-tight">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="for-recruiters"
          aria-labelledby="for-recruiters-heading"
          className="border-t"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2
                id="for-recruiters-heading"
                className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                Stop reading resumes. Start reading results.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Applicants arrive ranked by verified skill score, with AI feedback
                attached. Post a role with a salary range and a deadline, and we handle
                the proving.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 w-fit px-5 text-sm">
              <Link href="/register?role=recruiter">
                Post a role
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
