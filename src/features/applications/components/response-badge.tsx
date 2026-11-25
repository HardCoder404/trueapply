import { Badge } from "@/components/ui/badge";
import { recruiterResponseWindowDays } from "@/lib/constants";

import type { ResponseStats } from "../queries";

export function ResponseBadge({
  stats,
  className,
}: {
  stats: ResponseStats | undefined;
  className?: string;
}) {
  if (!stats || stats.total === 0) return null;

  if (stats.slowResponder) {
    return (
      <Badge
        variant="outline"
        className={`border-dashed font-mono text-muted-foreground ${className ?? ""}`}
      >
        Slow responder
      </Badge>
    );
  }
  if (stats.responseRate == null) return null;

  return (
    <Badge variant="outline" className={`font-mono ${className ?? ""}`}>
      Replies to {Math.round(stats.responseRate * 100)}% within{" "}
      {recruiterResponseWindowDays} days
    </Badge>
  );
}
