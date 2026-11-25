import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

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

export default async function OnboardingPage() {
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
          <OnboardingForm
            defaultName={defaultName}
            defaultRole={roleFromMetadata(clerkUser?.unsafeMetadata.role)}
            emailDomain={email?.split("@")[1]?.toLowerCase() ?? null}
          />
        </div>
      </section>
    </main>
  );
}
