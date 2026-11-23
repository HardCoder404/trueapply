import Link from "next/link";

import { siteConfig } from "@/lib/constants";

import { Wordmark } from "./wordmark";

const footerLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-2">
          <Wordmark />
          <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="font-mono text-xs text-muted-foreground">
          © 2026 {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
