import { siteConfig } from "@/lib/constants";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

function escape(text: string) {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function layout(
  title: string,
  paragraphs: string[],
  cta: { label: string; path: string },
) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escape(p)}</p>`)
    .join("");
  const url = `${siteUrl()}${cta.path}`;
  return {
    html: `<!doctype html><html><body style="margin:0;background:#0a0a0a;color:#fafafa;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <p style="font:600 14px/1 monospace;letter-spacing:.08em;text-transform:uppercase;color:#a3a3a3;margin:0 0 24px">${escape(siteConfig.name)}</p>
  <h1 style="font-size:22px;font-weight:600;letter-spacing:-.01em;margin:0 0 20px">${escape(title)}</h1>
  ${body}
  <p style="margin:28px 0 0"><a href="${url}" style="display:inline-block;background:#fafafa;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:8px">${escape(cta.label)}</a></p>
  <p style="margin:32px 0 0;font-size:12px;color:#737373">${escape(siteConfig.tagline)}</p>
</div></body></html>`,
    text: `${title}\n\n${paragraphs.join("\n\n")}\n\n${cta.label}: ${url}`,
  };
}

export const stageLabels = {
  applied: "Applied",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offer",
  rejected: "Not selected",
} as const;

export function stageChangedEmail(input: {
  seekerName: string;
  jobTitle: string;
  companyName: string;
  stage: keyof typeof stageLabels;
  reason: string | null;
}) {
  const label = stageLabels[input.stage];
  const title =
    input.stage === "rejected"
      ? `${input.companyName} will not move forward with ${input.jobTitle}`
      : `${input.companyName} moved you to ${label} for ${input.jobTitle}`;
  const paragraphs = [
    `Hi ${input.seekerName.split(" ")[0]},`,
    input.stage === "rejected"
      ? `${input.companyName} reviewed your application for ${input.jobTitle} and decided not to continue. They had to give a reason, and here it is:`
      : `Your application for ${input.jobTitle} at ${input.companyName} is now at the ${label} stage.`,
  ];
  if (input.reason) paragraphs.push(`"${input.reason}"`);
  paragraphs.push(
    "Your verified skill scores stay on your portfolio for every other role.",
  );
  return {
    subject: title,
    ...layout(title, paragraphs, {
      label: "See your applications",
      path: "/seeker/applications",
    }),
  };
}

export function newApplicantEmail(input: {
  recruiterName: string;
  seekerName: string;
  jobTitle: string;
  jobId: string;
  skillScore: number | null;
}) {
  const title = `${input.seekerName} applied for ${input.jobTitle}`;
  const paragraphs = [
    `Hi ${input.recruiterName.split(" ")[0]},`,
    input.skillScore != null
      ? `${input.seekerName} completed the challenges for ${input.jobTitle} with a verified skill score of ${input.skillScore} out of 100.`
      : `${input.seekerName} applied for ${input.jobTitle}.`,
    "Candidates can see how long their application has sat untouched, so a quick first look keeps your response rate high.",
  ];
  return {
    subject: title,
    ...layout(title, paragraphs, {
      label: "Review applicants",
      path: `/recruiter/jobs/${input.jobId}/applicants`,
    }),
  };
}

export function nudgeEmail(input: {
  recruiterName: string;
  jobTitle: string;
  jobId: string;
  waiting: number;
  oldestDays: number;
}) {
  const title = `${input.waiting} applicant${input.waiting === 1 ? " is" : "s are"} waiting on ${input.jobTitle}`;
  const paragraphs = [
    `Hi ${input.recruiterName.split(" ")[0]},`,
    `${input.waiting} application${input.waiting === 1 ? "" : "s"} for ${input.jobTitle} ${input.waiting === 1 ? "has" : "have"} had no update for 5 days or more. The oldest has waited ${input.oldestDays} days.`,
    "After 7 days without a response your company is marked as a slow responder on every listing, and the role's Reality Score drops. A quick review or a rejection with a reason both count as a response.",
  ];
  return {
    subject: title,
    ...layout(title, paragraphs, {
      label: "Review applicants",
      path: `/recruiter/jobs/${input.jobId}/applicants`,
    }),
  };
}
