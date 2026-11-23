import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TrueApply account.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <PlaceholderPage
      eyebrow="Sign in"
      title="Welcome back."
      description="Authentication lands in Phase 1. This page will hold the sign-in form for both job seekers and recruiters."
    />
  );
}
