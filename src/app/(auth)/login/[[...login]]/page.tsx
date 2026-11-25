import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PendingScreen } from "@/components/layout/pending-screen";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TrueApply account.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<PendingScreen />}>
      <SignIn />
    </Suspense>
  );
}
