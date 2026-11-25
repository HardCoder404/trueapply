import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { coachConversations, coachMessages } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/queries";
import { runCoach, type CoachEvent } from "@/features/coach/agent";
import {
  countMessagesToday,
  dailyMessageLimit,
  getConversation,
} from "@/features/coach/queries";

const bodySchema = z.object({
  conversationId: z.uuid().nullable().optional(),
  message: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  if (!account || account.role !== "seeker")
    return new Response("Sign in as a job seeker.", { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return new Response("Send a message between 1 and 1000 characters.", { status: 400 });

  if ((await countMessagesToday(account.id)) >= dailyMessageLimit) {
    return new Response(
      `You have used today's ${dailyMessageLimit} messages. Back tomorrow.`,
      { status: 429 },
    );
  }

  const db = getDb();
  const { message } = parsed.data;
  let conversationId = parsed.data.conversationId ?? null;
  let history: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (conversationId) {
    const existing = await getConversation(conversationId, account.id);
    if (!existing) return new Response("Conversation not found.", { status: 404 });
    history = existing.messages
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));
  } else {
    const [created] = await db
      .insert(coachConversations)
      .values({ userId: account.id, title: message.slice(0, 60) })
      .returning({ id: coachConversations.id });
    conversationId = created.id;
  }

  await db
    .insert(coachMessages)
    .values({ conversationId, role: "user", content: message });
  history.push({ role: "user", content: message });

  const encoder = new TextEncoder();
  const userId = account.id;
  const finalConversationId = conversationId;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: CoachEvent | { t: "done"; conversationId: string }) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const result = await runCoach(userId, history, emit);
        const content =
          result.content.trim() ||
          "I could not find enough on the platform to answer that. Try a more specific role or skill.";
        await db.batch([
          db.insert(coachMessages).values({
            conversationId: finalConversationId,
            role: "assistant",
            content,
            sources: result.sources,
            toolsUsed: result.toolsUsed,
          }),
          db
            .update(coachConversations)
            .set({ updatedAt: new Date() })
            .where(and(eq(coachConversations.id, finalConversationId))),
        ]);
        emit({ t: "done", conversationId: finalConversationId });
      } catch (error) {
        console.error("Coach run failed", error);
        emit({ t: "error", v: "The coach hit a problem. Try again in a moment." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
