import { markNudged, recruiterForCompany } from "@/features/applications/actions";
import { staleApplicationsForNudge } from "@/features/applications/queries";
import { sendEmail } from "@/lib/email/send";
import { nudgeEmail } from "@/lib/email/templates";
import { daysSince } from "@/lib/format";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stale = await staleApplicationsForNudge();
  const byJob = new Map<string, typeof stale>();
  for (const row of stale) byJob.set(row.jobId, [...(byJob.get(row.jobId) ?? []), row]);

  let emails = 0;
  for (const rows of byJob.values()) {
    const recruiter = await recruiterForCompany(rows[0].recruiterId);
    if (!recruiter) continue;
    const oldestDays = Math.max(...rows.map((row) => daysSince(row.appliedAt)));
    const result = await sendEmail({
      to: recruiter.email,
      ...nudgeEmail({
        recruiterName: recruiter.name,
        jobTitle: rows[0].jobTitle,
        jobId: rows[0].jobId,
        waiting: rows.length,
        oldestDays,
      }),
    });
    if (result.sent) emails += 1;
    await markNudged(rows.map((row) => row.applicationId));
  }

  return Response.json({ applications: stale.length, emails });
}
