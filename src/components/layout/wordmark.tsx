import Link from "next/link";

import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "inline-flex items-center gap-2.5 py-2.5 font-semibold tracking-tight",
        className,
      )}
    >
      <span aria-hidden className="grid size-5 grid-cols-2 gap-px">
        <span className="bg-foreground" />
        <span className="bg-foreground/30" />
        <span className="bg-foreground/30" />
        <span className="bg-foreground" />
      </span>
      {siteConfig.name}
    </Link>
  );
}
