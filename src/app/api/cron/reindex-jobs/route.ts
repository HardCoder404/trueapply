import { reindexOpenJobs } from "@/features/coach/index-jobs";
import { reindexSeekers } from "@/features/talent/index-seekers";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const [jobs, seekers] = await Promise.all([reindexOpenJobs(), reindexSeekers()]);
  return Response.json({ jobs, seekers });
}
