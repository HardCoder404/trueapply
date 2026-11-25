import type { RealitySignal } from "@/db/schema";

export function RealityBreakdown({ signals }: { signals: RealitySignal[] }) {
  return (
    <ul className="divide-y">
      {signals.map((signal) => {
        const ratio = signal.max ? signal.points / signal.max : 0;
        return (
          <li key={signal.key} className="space-y-2 py-4 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">{signal.label}</span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {signal.points} / {signal.max}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full bg-foreground"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {signal.detail}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
