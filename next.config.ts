import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

function clerkFrontendApi() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return "https://*.clerk.accounts.dev";
  const encoded = key.split("_").at(-1) ?? "";
  const host = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  return host ? `https://${host}` : "https://*.clerk.accounts.dev";
}

const clerkApi = clerkFrontendApi();

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${clerkApi} https://challenges.cloudflare.com https://*.protect.clerk.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  `connect-src 'self' ${clerkApi} https://*.protect.clerk.com:* https://clerk-telemetry.com${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  `frame-src 'self' https://challenges.cloudflare.com https://*.protect.clerk.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const privateRouteHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const privateRoutes = ["/dashboard", "/onboarding", "/seeker/:path*", "/recruiter/:path*"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...privateRoutes.map((source) => ({ source, headers: privateRouteHeaders })),
    ];
  },
};

export default nextConfig;
