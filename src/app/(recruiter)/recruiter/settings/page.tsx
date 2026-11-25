import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { requireRole } from "@/features/auth/queries";
import { RecruiterSettingsForm } from "@/features/settings/components/recruiter-settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

async function Settings() {
  const account = await requireRole("recruiter");
  if (!account.company) return null;
  return <RecruiterSettingsForm user={account} company={account.company} />;
}

export default function RecruiterSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          You and your company.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Shown on every role you post. Email and password live in your account menu.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}
