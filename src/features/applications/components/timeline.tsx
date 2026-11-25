import type { applicationEvents } from "@/db/schema";
import { formatDate } from "@/lib/format";

import { stageLabels } from "./stage-badge";

type Event = typeof applicationEvents.$inferSelect;

export function Timeline({ events }: { events: Event[] }) {
  return (
    <ol className="space-y-3">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          <span
            aria-hidden
            className={`mt-1.5 size-2 shrink-0 rounded-full ${index === events.length - 1 ? "bg-foreground" : "bg-muted-foreground/50"}`}
          />
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-medium">{stageLabels[event.toStage]}</span>
              <span className="text-muted-foreground">
                {" "}
                · {formatDate(event.createdAt)}
              </span>
            </p>
            {event.reason && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                &ldquo;{event.reason}&rdquo;
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
