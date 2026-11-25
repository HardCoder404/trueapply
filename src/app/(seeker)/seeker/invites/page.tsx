import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/queries";
import { InviteCard } from "@/features/talent/components/invite-card";
import { listSeekerInvites } from "@/features/talent/queries";

export const metadata: Metadata = {
  title: "Interview invitations",
  robots: { index: false },
};

async function Invites() {
  await connection();
  const account = await requireRole("seeker");
  const rows = await listSeekerInvites(account.id);
  const discoverable = account.seekerProfile?.discoverable ?? true;

  if (!rows.length) {
    return (
      <div className="rounded-xl p-10 text-center ring-1 ring-foreground/10">
        <p className="font-medium">No invitations yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {discoverable
            ? "Companies find you through graded challenges. Every verified skill raises your odds."
            : "You are hidden from the talent pool. Turn on discovery in settings to receive invitations."}
        </p>
        <Button asChild className="mt-6 h-11 px-5 text-sm">
          <Link href={discoverable ? "/jobs" : "/seeker/settings"}>
            {discoverable ? "Take a challenge" : "Open settings"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((invite) => (
        <InviteCard key={invite.id} invite={invite} />
      ))}
    </ul>
  );
}

export default function SeekerInvitesPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Invitations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Companies that came to you.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          They saw your scores, not your name. Accept to reveal your profile and jump
          straight to the interview stage.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Invites />
      </Suspense>
    </div>
  );
}
