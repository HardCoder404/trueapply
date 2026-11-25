import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import { userRoles, type UserRole } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join TrueApply as a job seeker or a recruiter.",
  robots: { index: false },
};

function pickRole(value: string | string[] | undefined): UserRole | undefined {
  return userRoles.find((role) => role === value);
}

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register/[[...register]]">) {
  const role = pickRole((await searchParams).role);

  return <SignUp unsafeMetadata={role ? { role } : undefined} />;
}
