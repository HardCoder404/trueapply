"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ConversationSummary = { id: string; title: string; updatedAt: Date };

type CoachStore = {
  conversations: ConversationSummary[];
  activeId: string | null;
  addConversation: (conversation: ConversationSummary) => void;
  touchConversation: (id: string) => void;
};

const CoachContext = createContext<CoachStore | null>(null);

export function CoachProvider({
  initialConversations,
  initialActiveId,
  children,
}: {
  initialConversations: ConversationSummary[];
  initialActiveId: string | null;
  children: ReactNode;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialActiveId);

  const store: CoachStore = {
    conversations,
    activeId,
    addConversation(conversation) {
      setConversations((list) => [
        conversation,
        ...list.filter((c) => c.id !== conversation.id),
      ]);
      setActiveId(conversation.id);
    },
    touchConversation(id) {
      setConversations((list) => {
        const found = list.find((c) => c.id === id);
        if (!found) return list;
        return [{ ...found, updatedAt: new Date() }, ...list.filter((c) => c.id !== id)];
      });
    },
  };

  return <CoachContext.Provider value={store}>{children}</CoachContext.Provider>;
}

export function useCoachStore() {
  const store = useContext(CoachContext);
  if (!store) throw new Error("useCoachStore must be used inside CoachProvider");
  return store;
}
