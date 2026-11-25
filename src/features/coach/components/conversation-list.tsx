"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { deleteConversation } from "../actions";
import { useCoachStore } from "./coach-context";

export function ConversationList() {
  const { conversations, activeId } = useCoachStore();

  return (
    <nav aria-label="Conversations" className="space-y-3">
      <Button
        asChild
        variant="outline"
        className="h-11 w-full justify-start px-3 text-sm"
      >
        <Link href="/seeker/coach">
          <Plus data-icon="inline-start" />
          New conversation
        </Link>
      </Button>
      {conversations.length > 0 && (
        <ul className="space-y-1">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="group flex items-center gap-1">
              <Link
                href={`/seeker/coach/${conversation.id}`}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-card",
                  conversation.id === activeId
                    ? "bg-card font-medium"
                    : "text-muted-foreground",
                )}
              >
                <span className="block truncate">{conversation.title}</span>
                <span className="block font-mono text-[11px] text-muted-foreground">
                  {formatDate(conversation.updatedAt)}
                </span>
              </Link>
              <form action={deleteConversation}>
                <input type="hidden" name="conversationId" value={conversation.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground opacity-60 hover:opacity-100"
                  aria-label={`Delete ${conversation.title}`}
                >
                  <Trash2 />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
