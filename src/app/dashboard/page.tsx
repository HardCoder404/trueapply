import { redirect } from "next/navigation";

import { dashboardPath, requireAccount } from "@/features/auth/queries";

export const instant = false;

export default async function DashboardPage() {
  const account = await requireAccount();
  redirect(dashboardPath(account.role));
}
