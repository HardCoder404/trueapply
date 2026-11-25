"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { CoachSource } from "@/db/schema";

import { useCoachStore } from "./coach-context";
import { MessageBody } from "./message-body";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: CoachSource[] | null;
};

const toolLabels: Record<string, string> = {
  search_jobs: "Searching open roles",
  get_skill_trends: "Reading skill demand and pay",
  compare_skills: "Comparing your skills with the market",
  get_learning_resources: "Finding resources",
};

const starters = [
  "How ready am I for a senior frontend role?",
  "Which skills pay the most on the platform right now?",
  "What should I learn next to raise my score?",
  "Find remote roles that match my skills",
];

type ChatProps = {
  conversationId: string | null;
  initialMessages: ChatMessage[];
  remaining: number;
};

export function Chat({
  conversationId: initialConversationId,
  initialMessages,
  remaining,
}: ChatProps) {
  const { addConversation, touchConversation } = useCoachStore();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<{
    content: string;
    status: string | null;
    sources: CoachSource[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(remaining);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming?.content]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setError(null);
    setDraft("");
    setMessages((list) => [
      ...list,
      { id: `local-${Date.now()}`, role: "user", content: message },
    ]);
    setStreaming({ content: "", status: "Thinking", sources: [] });

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, message }),
      });
      if (!response.ok || !response.body) {
        const detail = await response.text();
        throw new Error(detail || `Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      let sources: CoachSource[] = [];
      let newConversationId: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            t: string;
            v?: unknown;
            conversationId?: string;
          };
          if (event.t === "token") {
            content += String(event.v);
            setStreaming({ content, status: null, sources });
          } else if (event.t === "tool") {
            setStreaming({
              content,
              status: toolLabels[String(event.v)] ?? "Working",
              sources,
            });
          } else if (event.t === "sources") {
            sources = event.v as CoachSource[];
            setStreaming({ content, status: null, sources });
          } else if (event.t === "done") {
            newConversationId = event.conversationId ?? null;
          } else if (event.t === "error") {
            throw new Error(String(event.v));
          }
        }
      }

      setMessages((list) => [
        ...list,
        { id: `assistant-${Date.now()}`, role: "assistant", content, sources },
      ]);
      setStreaming(null);
      setLeft((n) => Math.max(0, n - 1));
      if (!conversationId && newConversationId) {
        // Keep the chat mounted: swap the URL in place and add the thread to the sidebar.
        setConversationId(newConversationId);
        window.history.replaceState(null, "", `/seeker/coach/${newConversationId}`);
        addConversation({
          id: newConversationId,
          title: message.slice(0, 60),
          updatedAt: new Date(),
        });
      } else if (conversationId) {
        touchConversation(conversationId);
      }
    } catch (caught) {
      setStreaming(null);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  const empty = messages.length === 0 && !streaming;

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-6">
        {empty && (
          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
            <p className="font-medium">Ask about roles, pay, or what to learn.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every answer is pulled from live postings and your verified scores, not from
              generic advice.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {starters.map((starter) => (
                <li key={starter}>
                  <button
                    type="button"
                    onClick={() => void send(starter)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:border-foreground"
                  >
                    {starter}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {streaming && (
          <div className="space-y-3">
            {streaming.status && (
              <p
                className="font-mono text-xs text-muted-foreground uppercase motion-safe:animate-pulse"
                aria-live="polite"
              >
                {streaming.status}…
              </p>
            )}
            {streaming.content && (
              <Message
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streaming.content,
                  sources: streaming.sources,
                }}
              />
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-border px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-0 mt-8 bg-background pt-3 pb-2">
        <div className="flex items-end gap-2 rounded-xl bg-card p-2 ring-1 ring-foreground/15 focus-within:ring-foreground/40">
          <label htmlFor="coach-input" className="sr-only">
            Message the coach
          </label>
          <textarea
            id="coach-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            maxLength={1000}
            placeholder={
              left > 0 ? "Ask the coach…" : "Daily limit reached. Back tomorrow."
            }
            disabled={!!streaming || left <= 0}
            className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!!streaming || !draft.trim() || left <= 0}
            className="size-11 shrink-0"
            aria-label="Send"
          >
            <ArrowUp />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {left} message{left === 1 ? "" : "s"} left today. The coach reads your verified
          scores and live postings only.
        </p>
      </form>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-xl bg-foreground px-4 py-2.5 text-[15px] leading-relaxed text-background">
          {message.content}
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-[95%] space-y-3">
      <MessageBody text={message.content} />
      {message.sources?.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {message.sources.map((source) => (
            <li key={source.slug}>
              <Link
                href={`/jobs/${source.slug}`}
                className="inline-flex h-7 items-center rounded-full border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {source.title} · {source.company}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
