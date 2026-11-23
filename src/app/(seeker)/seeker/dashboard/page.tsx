import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Seeker dashboard",
  robots: { index: false },
};

export default function SeekerDashboardPage() {
  return (
    <PlaceholderPage
      eyebrow="Job seeker"
      title="Your verified skills and live applications."
      description="Challenges, skill scores and application tracking will show up here once Phases 3 and 4 are built."
    />
  );
}
