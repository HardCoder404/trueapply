import { cache } from "react";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";

import { getDb } from "@/db";
import { coachConversations, coachMessages } from "@/db/schema";

export const dailyMessageLimit = 40;

export async function listConversations(userId: string) {
  return getDb().query.coachConversations.findMany({
    where: eq(coachConversations.userId, userId),
    orderBy: [desc(coachConversations.updatedAt)],
    limit: 30,
  });
}

export const getConversation = cache(async (id: string, userId: string) => {
  const conversation = await getDb().query.coachConversations.findFirst({
    where: and(eq(coachConversations.id, id), eq(coachConversations.userId, userId)),
    with: { messages: { orderBy: [asc(coachMessages.createdAt)] } },
  });
  return conversation ?? null;
});

export async function countMessagesToday(userId: string) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(coachMessages)
    .innerJoin(
      coachConversations,
      eq(coachMessages.conversationId, coachConversations.id),
    )
    .where(
      and(
        eq(coachConversations.userId, userId),
        eq(coachMessages.role, "user"),
        gte(coachMessages.createdAt, since),
      ),
    );
  return total;
}
