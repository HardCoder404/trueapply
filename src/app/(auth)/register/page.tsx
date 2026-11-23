import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join TrueApply as a job seeker or a recruiter.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <PlaceholderPage
      eyebrow="Create account"
      title="Pick a side. Both have to prove themselves."
      description="Role selection and onboarding arrive with Phase 1. Seekers will verify skills, recruiters will verify their company."
    />
  );
}
