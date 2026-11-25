"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { companies, seekerProfiles, users } from "@/db/schema";
import { freeMailDomains } from "@/lib/constants";

import { dashboardPath } from "./queries";
import { onboardingSchema } from "./schemas";

export type OnboardingState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
} | null;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function completeOnboarding(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { isAuthenticated, userId } = await auth();
  const clerkUser = isAuthenticated ? await currentUser() : null;
  if (!userId || !clerkUser) {
    return { message: "Your session expired. Sign in and try again." };
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return {
      message: "Your account has no email address. Add one in your profile first.",
    };
  }

  const role = text(formData, "role");
  const parsed = onboardingSchema.safeParse(
    role === "recruiter"
      ? {
          role,
          name: text(formData, "name"),
          companyName: text(formData, "companyName"),
          companyDomain: text(formData, "companyDomain"),
          companySize: text(formData, "companySize"),
          industry: text(formData, "industry"),
        }
      : {
          role,
          name: text(formData, "name"),
          headline: text(formData, "headline"),
          bio: text(formData, "bio"),
          skills: formData
            .getAll("skills")
            .filter((s): s is string => typeof s === "string"),
          location: text(formData, "location"),
          experienceLevel: text(formData, "experienceLevel"),
        },
  );

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    columns: { role: true },
  });
  if (existing) redirect(dashboardPath(existing.role));

  const data = parsed.data;
  const id = crypto.randomUUID();
  const account = { id, clerkId: userId, email, name: data.name, role: data.role };

  if (data.role === "seeker") {
    await db.batch([
      db.insert(users).values(account),
      db.insert(seekerProfiles).values({
        userId: id,
        headline: data.headline,
        bio: data.bio,
        skills: data.skills,
        location: data.location,
        experienceLevel: data.experienceLevel,
      }),
    ]);
  } else {
    const emailDomain = email.split("@")[1]?.toLowerCase();
    const verified =
      emailDomain === data.companyDomain && !freeMailDomains.has(emailDomain);

    await db.batch([
      db.insert(users).values(account),
      db.insert(companies).values({
        userId: id,
        name: data.companyName,
        domain: data.companyDomain,
        size: data.companySize,
        industry: data.industry,
        verified,
      }),
    ]);
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, { publicMetadata: { role: data.role } });

  redirect(dashboardPath(data.role));
}
