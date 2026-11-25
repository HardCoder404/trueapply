import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { verdictFor, verdictLabels } from "../reality-score";

export function RealityBadge({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  const verdict = verdictFor(score);
  if (!verdict || score == null) {
    return (
      <Badge
        variant="outline"
        className={cn("font-mono text-muted-foreground", className)}
      >
        Unscored
      </Badge>
    );
  }

  return (
    <Badge
      variant={verdict === "verified" ? "default" : "outline"}
      className={cn(
        "gap-1.5 font-mono",
        verdict === "suspicious" && "border-dashed text-muted-foreground",
        className,
      )}
    >
      <span className="tabular-nums">{score}</span>
      <span aria-hidden>·</span>
      {verdictLabels[verdict]}
    </Badge>
  );
}
