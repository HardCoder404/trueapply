"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { companies, seekerProfiles, users } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/queries";
import { syncSeekerIndex } from "@/features/talent/index-seekers";

import { recruiterSettingsSchema, seekerSettingsSchema } from "./schemas";

export type SettingsState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  saved?: boolean;
} | null;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function syncClerkName(clerkId: string, name: string) {
  const [firstName, ...rest] = name.split(/\s+/);
  const client = await clerkClient();
  await client.users.updateUser(clerkId, {
    firstName,
    lastName: rest.join(" ") || undefined,
  });
}

export async function saveSeekerSettings(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  if (!account || account.role !== "seeker")
    return { message: "Sign in as a job seeker." };

  const parsed = seekerSettingsSchema.safeParse({
    name: text(formData, "name"),
    headline: text(formData, "headline"),
    bio: text(formData, "bio"),
    skills: formData.getAll("skills").filter((s): s is string => typeof s === "string"),
    location: text(formData, "location"),
    experienceLevel: text(formData, "experienceLevel"),
    preferredRoles: formData
      .getAll("preferredRoles")
      .filter((s): s is string => typeof s === "string"),
    discoverable: formData.get("discoverable") === "on",
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const data = parsed.data;
  const db = getDb();
  await db.batch([
    db.update(users).set({ name: data.name }).where(eq(users.id, account.id)),
    db
      .insert(seekerProfiles)
      .values({ userId: account.id, ...profileValues(data) })
      .onConflictDoUpdate({ target: seekerProfiles.userId, set: profileValues(data) }),
  ]);
  if (data.name !== account.name) await syncClerkName(account.clerkId, data.name);
  await syncSeekerIndex(account.id);

  revalidatePath("/seeker/dashboard");
  revalidatePath("/seeker/settings");
  if (account.handle) revalidatePath(`/u/${account.handle}`);
  return { saved: true };
}

function profileValues(data: z.infer<typeof seekerSettingsSchema>) {
  return {
    headline: data.headline,
    bio: data.bio,
    skills: data.skills,
    location: data.location,
    experienceLevel: data.experienceLevel,
    preferredRoles: data.preferredRoles,
    discoverable: data.discoverable,
  };
}

export async function saveRecruiterSettings(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  if (!account || account.role !== "recruiter" || !account.company)
    return { message: "Sign in as a recruiter." };

  const parsed = recruiterSettingsSchema.safeParse({
    name: text(formData, "name"),
    companyName: text(formData, "companyName"),
    companySize: text(formData, "companySize"),
    industry: text(formData, "industry"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const data = parsed.data;
  const db = getDb();
  await db.batch([
    db.update(users).set({ name: data.name }).where(eq(users.id, account.id)),
    db
      .update(companies)
      .set({ name: data.companyName, size: data.companySize, industry: data.industry })
      .where(eq(companies.id, account.company.id)),
  ]);
  if (data.name !== account.name) await syncClerkName(account.clerkId, data.name);

  revalidatePath("/recruiter/dashboard");
  revalidatePath("/recruiter/settings");
  revalidatePath("/jobs");
  return { saved: true };
}
