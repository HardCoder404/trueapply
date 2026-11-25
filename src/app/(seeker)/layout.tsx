import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

export default function SeekerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader
        area="Seeker"
        links={[
          { href: "/seeker/dashboard", label: "Overview" },
          { href: "/jobs", label: "Jobs" },
          { href: "/seeker/settings", label: "Settings" },
        ]}
      />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-8"
      >
        {children}
      </main>
    </>
  );
}
