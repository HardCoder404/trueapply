import type { Completion } from "../profile-completion";

export function ProfileCompletion({ completion }: { completion: Completion }) {
  const complete = completion.percent === 100;

  return (
    <section
      aria-labelledby="completion-heading"
      className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="completion-heading"
          className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
        >
          Profile completion
        </h2>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {completion.percent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={completion.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby="completion-heading"
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-foreground transition-[width] duration-700"
          style={{ width: `${completion.percent}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {complete
          ? "Everything is filled in."
          : `Still missing: ${completion.missing.join(", ")}.`}
      </p>
    </section>
  );
}
