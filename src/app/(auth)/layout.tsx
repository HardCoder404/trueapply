import Link from "next/link";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/layout/wordmark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Wordmark />
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back home
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        {children}
      </div>
    </main>
  );
}
