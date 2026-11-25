import "server-only";

import { createHash } from "node:crypto";

// Stable, opaque label for a seeker while their identity is hidden.
export function candidateLabel(userId: string) {
  const digest = createHash("sha1").update(userId).digest("hex");
  return `Candidate ${digest.slice(0, 4).toUpperCase()}`;
}
