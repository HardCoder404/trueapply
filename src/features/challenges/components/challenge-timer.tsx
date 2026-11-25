"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

export function ChallengeTimer({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt).getTime();
  const seconds = useSyncExternalStore(
    subscribe,
    () => Math.max(0, Math.floor((end - Date.now()) / 1000)),
    () => null,
  );

  if (seconds === null)
    return <span className="font-mono text-sm tabular-nums">--:--</span>;

  const minutes = Math.floor(seconds / 60);
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <span
      role="timer"
      aria-live="off"
      className={`font-mono text-sm tabular-nums ${seconds === 0 ? "text-muted-foreground line-through" : seconds < 120 ? "animate-pulse" : ""}`}
    >
      {label}
    </span>
  );
}
