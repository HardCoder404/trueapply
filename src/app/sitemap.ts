import type { MetadataRoute } from "next";

import { listOpenJobSlugs } from "@/features/jobs/queries";
import { siteConfig } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await listOpenJobSlugs();

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    ...jobs.map((job) => ({
      url: `${siteUrl}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
