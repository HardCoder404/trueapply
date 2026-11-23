import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Recruiter dashboard",
  robots: { index: false },
};

export default function RecruiterDashboardPage() {
  return (
    <PlaceholderPage
      eyebrow="Recruiter"
      title="Your roles, ranked applicants and response clock."
      description="Job posting, Reality Scores and the applicant pipeline will land here across Phases 2 and 4."
    />
  );
}
