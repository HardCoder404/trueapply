import type { ReactNode } from "react";

import { CoachProvider, type ConversationSummary } from "./coach-context";
import { ConversationList } from "./conversation-list";

export function CoachShell({
  conversations,
  activeId,
  children,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  children: ReactNode;
}) {
  return (
    <CoachProvider initialConversations={conversations} initialActiveId={activeId}>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside>
          <details className="lg:hidden">
            <summary className="cursor-pointer font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Conversations
            </summary>
            <div className="mt-3">
              <ConversationList />
            </div>
          </details>
          <div className="hidden lg:sticky lg:top-20 lg:block">
            <ConversationList />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </CoachProvider>
  );
}
