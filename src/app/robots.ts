import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/seeker/", "/recruiter/", "/dashboard", "/onboarding", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
