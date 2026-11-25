import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { Wordmark } from "./wordmark";

const navLinks = [
  { href: "/jobs", label: "Jobs" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-recruiters", label: "For recruiters" },
];

function AuthButtons() {
  return (
    <>
      <Show when="signed-out">
        <Button asChild variant="ghost" className="h-11 px-3 md:h-9">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild className="h-11 px-4 md:h-9 md:px-3.5">
          <Link href="/register">Get started</Link>
        </Button>
      </Show>
      <Show when="signed-in">
        <Button asChild variant="ghost" className="h-11 px-3 md:h-9">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <UserButton />
      </Show>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Suspense fallback={<span className="h-9 w-28" aria-hidden />}>
            <AuthButtons />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
