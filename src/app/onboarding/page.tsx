import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Wordmark } from "@/components/layout/wordmark";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { dashboardPath, getCurrentUser } from "@/features/auth/queries";
import { userRoles, type UserRole } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Set up your account",
  robots: { index: false },
};

function roleFromMetadata(value: unknown): UserRole | null {
  return userRoles.find((role) => role === value) ?? null;
}

async function OnboardingFormForUser() {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  const account = await getCurrentUser();
  if (account) redirect(dashboardPath(account.role));

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const defaultName = [clerkUser?.firstName, clerkUser?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <OnboardingForm
      defaultName={defaultName}
      defaultRole={roleFromMetadata(clerkUser?.unsafeMetadata.role)}
      emailDomain={email?.split("@")[1]?.toLowerCase() ?? null}
    />
  );
}

function FormSkeleton() {
  return (
    <div aria-hidden className="space-y-3 motion-safe:animate-pulse">
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 rounded-lg bg-muted" />
        <div className="h-14 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center px-5 py-3 sm:px-8">
        <Wordmark />
      </div>

      <section className="mx-auto w-full max-w-xl px-5 py-10 sm:px-8 sm:py-16">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Almost there
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Set up your account.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Takes a minute. You can change everything later.
        </p>

        <div className="mt-10">
          <Suspense fallback={<FormSkeleton />}>
            <OnboardingFormForUser />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
