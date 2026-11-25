import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { requireRole } from "@/features/auth/queries";
import { SeekerSettingsForm } from "@/features/settings/components/seeker-settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

async function Settings() {
  const account = await requireRole("seeker");
  return <SeekerSettingsForm user={account} profile={account.seekerProfile} />;
}

export default function SeekerSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your profile.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          What companies and your public portfolio show. Email and password live in your
          account menu.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}
