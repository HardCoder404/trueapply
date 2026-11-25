import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { requireRole } from "@/features/auth/queries";
import { Chat } from "@/features/coach/components/chat";
import { CoachShell } from "@/features/coach/components/coach-shell";
import {
  countMessagesToday,
  dailyMessageLimit,
  getConversation,
  listConversations,
} from "@/features/coach/queries";

export const metadata: Metadata = {
  title: "Career coach",
  robots: { index: false },
};

type ConversationPageProps = PageProps<"/seeker/coach/[id]">;

async function Conversation({ params }: Pick<ConversationPageProps, "params">) {
  const account = await requireRole("seeker");
  const conversation = await getConversation((await params).id, account.id);
  if (!conversation) notFound();

  const [conversations, used] = await Promise.all([
    listConversations(account.id),
    countMessagesToday(account.id),
  ]);

  return (
    <CoachShell
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      }))}
      activeId={conversation.id}
    >
      <Chat
        conversationId={conversation.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
        }))}
        remaining={Math.max(0, dailyMessageLimit - used)}
      />
    </CoachShell>
  );
}

export default function ConversationPage({ params }: ConversationPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Career coach
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Advice with receipts.
        </h1>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Conversation params={params} />
      </Suspense>
    </div>
  );
}
