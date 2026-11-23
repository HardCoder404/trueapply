import Link from "next/link";

import { Wordmark } from "./wordmark";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Wordmark />
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back home
        </Link>
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16 sm:px-8">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  );
}
