"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { coachConversations } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/queries";

export async function deleteConversation(formData: FormData) {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  const id = formData.get("conversationId");
  if (!account || account.role !== "seeker" || typeof id !== "string") return;

  await getDb()
    .delete(coachConversations)
    .where(and(eq(coachConversations.id, id), eq(coachConversations.userId, account.id)));

  revalidatePath("/seeker/coach");
  redirect("/seeker/coach");
}
