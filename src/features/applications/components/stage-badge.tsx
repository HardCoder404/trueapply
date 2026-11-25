import { Badge } from "@/components/ui/badge";
import type { ApplicationStage } from "@/lib/constants";
import { stageLabels } from "@/lib/email/templates";
import { cn } from "@/lib/utils";

export { stageLabels };

export function StageBadge({
  stage,
  className,
}: {
  stage: ApplicationStage;
  className?: string;
}) {
  return (
    <Badge
      variant={stage === "offered" || stage === "interview" ? "default" : "outline"}
      className={cn(
        "font-mono",
        stage === "rejected" && "border-dashed text-muted-foreground",
        className,
      )}
    >
      {stageLabels[stage]}
    </Badge>
  );
}
