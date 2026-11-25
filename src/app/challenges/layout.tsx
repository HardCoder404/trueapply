import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

export default function ChallengeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader
        area="Challenge"
        links={[
          { href: "/seeker/dashboard", label: "Overview" },
          { href: "/jobs", label: "Jobs" },
        ]}
      />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10"
      >
        {children}
      </main>
    </>
  );
}
