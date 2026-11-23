import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
