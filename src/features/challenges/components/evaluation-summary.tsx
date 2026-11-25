import type { EvaluationBreakdown } from "@/db/schema";

const dimensions: Array<{ key: keyof EvaluationBreakdown; label: string; max: number }> =
  [
    { key: "correctness", label: "Correctness", max: 40 },
    { key: "quality", label: "Code quality", max: 25 },
    { key: "edgeCases", label: "Edge cases", max: 20 },
    { key: "readability", label: "Readability", max: 15 },
  ];

export function EvaluationSummary({
  score,
  feedback,
  breakdown,
}: {
  score: number;
  feedback: string;
  breakdown: EvaluationBreakdown;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-start justify-center rounded-xl bg-card p-6 ring-1 ring-foreground/10 lg:w-56">
        <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Skill score
        </span>
        <span className="mt-2 text-6xl font-semibold tracking-tight tabular-nums">
          {score}
        </span>
        <span className="text-sm text-muted-foreground">out of 100</span>
      </div>

      <div className="space-y-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {dimensions.map(({ key, label, max }) => {
            const value = breakdown[key] as number;
            return (
              <li key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {value} / {max}
                  </span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-[15px] leading-relaxed">{feedback}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Notes title="What worked" items={breakdown.strengths} />
          <Notes title="What to tighten" items={breakdown.gaps} />
        </div>
      </div>
    </div>
  );
}

function Notes({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              aria-hidden
              className="mt-2 size-1 shrink-0 rounded-full bg-foreground"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
