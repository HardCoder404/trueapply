import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PendingScreen } from "@/components/layout/pending-screen";
import { userRoles, type UserRole } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join TrueApply as a job seeker or a recruiter.",
  robots: { index: false },
};

type RegisterPageProps = PageProps<"/register/[[...register]]">;

function pickRole(value: string | string[] | undefined): UserRole | undefined {
  return userRoles.find((role) => role === value);
}

async function SignUpWithRole({ searchParams }: Pick<RegisterPageProps, "searchParams">) {
  const role = pickRole((await searchParams).role);
  return <SignUp unsafeMetadata={role ? { role } : undefined} />;
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense fallback={<PendingScreen />}>
      <SignUpWithRole searchParams={searchParams} />
    </Suspense>
  );
}
