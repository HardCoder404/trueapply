import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { jobs } from "@/db/schema";
import { removeJobIndex } from "@/features/coach/index-jobs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const archived = await getDb()
    .update(jobs)
    .set({ status: "archived" })
    .where(and(eq(jobs.status, "open"), lt(jobs.deadline, new Date())))
    .returning({ id: jobs.id, slug: jobs.slug });

  if (archived.length) {
    await removeJobIndex(archived.map((job) => job.id));
    revalidatePath("/jobs");
    revalidatePath("/sitemap.xml");
    for (const job of archived) revalidatePath(`/jobs/${job.slug}`);
  }

  return Response.json({ archived: archived.length });
}
