export function DashboardSkeleton() {
  return (
    <div aria-hidden className="space-y-10 motion-safe:animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-9 w-56 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="h-40 rounded-xl bg-card ring-1 ring-foreground/10" />
        <div className="h-40 rounded-xl bg-card ring-1 ring-foreground/10" />
      </div>
    </div>
  );
}
