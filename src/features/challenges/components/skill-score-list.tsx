import { Badge } from "@/components/ui/badge";

import type { SkillScore } from "../types";

export function SkillScoreList({
  scores,
  claimed = [],
}: {
  scores: SkillScore[];
  claimed?: string[];
}) {
  const verified = new Map(scores.map((s) => [s.skill.toLowerCase(), s]));
  const unverified = claimed.filter((skill) => !verified.has(skill.toLowerCase()));

  if (!scores.length && !unverified.length) {
    return <p className="text-sm text-muted-foreground">No skills yet.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {scores.map((score) => (
        <li key={score.id}>
          <Badge className="h-7 gap-1.5 px-3 font-normal">
            {score.skill}
            <span className="font-mono tabular-nums opacity-70">{score.score}</span>
          </Badge>
        </li>
      ))}
      {unverified.map((skill) => (
        <li key={skill}>
          <Badge variant="outline" className="h-7 px-3 font-normal text-muted-foreground">
            {skill}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
