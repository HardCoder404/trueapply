import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import type { UserRole } from "@/lib/constants";

export function dashboardPath(role: UserRole) {
  return `/${role}/dashboard` as const;
}

export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await getDb().query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { seekerProfile: true, company: true },
  });

  return user ?? null;
});

export async function requireAccount() {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) redirectToSignIn();

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAccount();
  if (user.role !== role) redirect(dashboardPath(user.role));
  return user;
}
