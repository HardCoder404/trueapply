import { matchWeights } from "../matching";

const labels = {
  skillMatch: "Skill match",
  performance: "Challenge performance",
  trajectory: "Trajectory fit",
} as const;

export function MatchFactors({
  factors,
}: {
  factors: { skillMatch: number; performance: number; trajectory: number };
}) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {(Object.keys(labels) as Array<keyof typeof labels>).map((key) => (
        <div key={key}>
          <dt className="font-mono text-[11px] text-muted-foreground uppercase">
            {labels[key]} · {Math.round(matchWeights[key] * 100)}%
          </dt>
          <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {factors[key]}
          </dd>
          <div className="mt-1 h-1 rounded-full bg-muted" aria-hidden>
            <div
              className="h-1 rounded-full bg-foreground"
              style={{ width: `${factors[key]}%` }}
            />
          </div>
        </div>
      ))}
    </dl>
  );
}
