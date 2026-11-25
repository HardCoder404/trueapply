import "server-only";

import { eq, inArray, notInArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { seekerEmbeddings, seekerProfiles, skillScores, users } from "@/db/schema";
import { embed } from "@/lib/ai/embeddings";
import { experienceLevelLabels } from "@/lib/constants";

type SeekerDoc = {
  userId: string;
  headline: string | null;
  location: string | null;
  experienceLevel: keyof typeof experienceLevelLabels | null;
  preferredRoles: string[];
  skills: string[];
  verified: Array<{ skill: string; score: number }>;
};

function seekerDocument(seeker: SeekerDoc) {
  return [
    seeker.preferredRoles.length
      ? `Target roles: ${seeker.preferredRoles.join(", ")}`
      : null,
    seeker.headline ? `Headline: ${seeker.headline}` : null,
    seeker.experienceLevel
      ? `Experience: ${experienceLevelLabels[seeker.experienceLevel]}`
      : null,
    seeker.location ? `Location: ${seeker.location}` : null,
    seeker.verified.length
      ? `Verified skills: ${seeker.verified.map((s) => `${s.skill} (${s.score}/100)`).join(", ")}`
      : null,
    seeker.skills.length ? `Other skills: ${seeker.skills.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function loadSeekers(userIds?: string[]) {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      headline: seekerProfiles.headline,
      location: seekerProfiles.location,
      experienceLevel: seekerProfiles.experienceLevel,
      preferredRoles: seekerProfiles.preferredRoles,
      skills: seekerProfiles.skills,
      discoverable: seekerProfiles.discoverable,
    })
    .from(users)
    .innerJoin(seekerProfiles, eq(seekerProfiles.userId, users.id))
    .where(userIds ? inArray(users.id, userIds) : eq(users.role, "seeker"));
  if (!rows.length) return [];

  const scores = await db.query.skillScores.findMany({
    where: inArray(
      skillScores.userId,
      rows.map((r) => r.userId),
    ),
  });
  const byUser = new Map<string, Array<{ skill: string; score: number }>>();
  for (const s of scores) {
    byUser.set(s.userId, [
      ...(byUser.get(s.userId) ?? []),
      { skill: s.skill, score: s.score },
    ]);
  }
  return rows.map((row) => ({ ...row, verified: byUser.get(row.userId) ?? [] }));
}

async function indexSeekers(seekers: Awaited<ReturnType<typeof loadSeekers>>) {
  const eligible = seekers.filter((s) => s.discoverable && s.verified.length > 0);
  const dropped = seekers.filter((s) => !eligible.includes(s)).map((s) => s.userId);
  const db = getDb();
  if (dropped.length) {
    await db.delete(seekerEmbeddings).where(inArray(seekerEmbeddings.userId, dropped));
  }
  if (!eligible.length) return { indexed: 0, removed: dropped.length };

  const docs = eligible.map(seekerDocument);
  const vectors = await embed(docs);
  await db
    .insert(seekerEmbeddings)
    .values(
      eligible.map((seeker, i) => ({
        userId: seeker.userId,
        content: docs[i],
        embedding: vectors[i],
      })),
    )
    .onConflictDoUpdate({
      target: seekerEmbeddings.userId,
      set: {
        content: sql`excluded.content`,
        embedding: sql`excluded.embedding`,
        updatedAt: new Date(),
      },
    });
  return { indexed: eligible.length, removed: dropped.length };
}

// Best effort: a failed index must never break a settings save or a grading run.
export async function syncSeekerIndex(userId: string) {
  try {
    await indexSeekers(await loadSeekers([userId]));
  } catch (error) {
    console.error("Seeker index sync failed", error);
  }
}

export async function reindexSeekers() {
  const seekers = await loadSeekers();
  const result = await indexSeekers(seekers);
  const known = seekers.map((s) => s.userId);
  if (known.length) {
    await getDb()
      .delete(seekerEmbeddings)
      .where(notInArray(seekerEmbeddings.userId, known));
  }
  return result;
}
