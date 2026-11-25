import type { IntegritySignals } from "@/db/schema";

function minutes(seconds: number) {
  return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)} min`;
}

export function IntegrityNote({
  integrity,
  compact = false,
}: {
  integrity: IntegritySignals | null;
  compact?: boolean;
}) {
  if (!integrity)
    return compact ? null : (
      <p className="text-xs text-muted-foreground">No attempt signals were recorded.</p>
    );

  const flagged = integrity.pasteAttempts > 0 || integrity.tabSwitches > 3;

  if (compact) {
    return flagged ? (
      <span className="rounded-full border border-dashed px-2 py-0.5 font-mono text-[11px] text-muted-foreground uppercase">
        Check
      </span>
    ) : null;
  }

  return (
    <dl className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <dt className="font-mono text-xs text-muted-foreground uppercase">Active time</dt>
        <dd className="mt-1 font-medium">{minutes(integrity.activeSeconds)}</dd>
      </div>
      <div>
        <dt className="font-mono text-xs text-muted-foreground uppercase">
          Left the tab
        </dt>
        <dd className="mt-1 font-medium">{integrity.tabSwitches}×</dd>
      </div>
      <div>
        <dt className="font-mono text-xs text-muted-foreground uppercase">
          Paste attempts
        </dt>
        <dd className="mt-1 font-medium">{integrity.pasteAttempts}</dd>
      </div>
    </dl>
  );
}
