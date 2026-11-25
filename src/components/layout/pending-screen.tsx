export function PendingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center py-24"
    >
      <span className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
        {label}
      </span>
    </div>
  );
}
