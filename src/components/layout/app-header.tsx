import { UserButton } from "@clerk/nextjs";

import { Wordmark } from "./wordmark";

export function AppHeader({ area }: { area: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span aria-hidden className="h-4 w-px bg-border" />
          <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {area}
          </span>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
