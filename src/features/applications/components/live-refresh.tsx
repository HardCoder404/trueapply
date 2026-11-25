"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveRefresh({ version }: { version: number }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const source = new EventSource(`/api/applications/stream?since=${version}`);
    source.onmessage = (event) => {
      if (Number(event.data) > version) router.refresh();
    };
    return () => source.close();
  }, [router, version]);

  return null;
}
