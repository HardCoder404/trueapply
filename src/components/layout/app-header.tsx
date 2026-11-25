import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { Wordmark } from "./wordmark";

type AppHeaderProps = {
  area: string;
  links?: Array<{ href: string; label: string }>;
};

export function AppHeader({ area, links = [] }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark />
          <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden font-mono text-xs tracking-wide text-muted-foreground uppercase sm:inline">
            {area}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <nav
            aria-label="Workspace"
            className="flex min-w-0 [scrollbar-width:none] items-center gap-4 overflow-x-auto sm:gap-5 [&::-webkit-scrollbar]:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex h-11 shrink-0 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
