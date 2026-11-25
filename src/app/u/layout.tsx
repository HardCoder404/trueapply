import type { ReactNode } from "react";

import { PublicShell } from "@/components/layout/public-shell";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
