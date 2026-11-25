import { auth } from "@clerk/nextjs/server";

import { seekerApplicationsVersion } from "@/features/applications/queries";
import { getCurrentUser } from "@/features/auth/queries";

const pollMs = 5_000;
const maxMs = 50_000;

export async function GET(request: Request) {
  const { isAuthenticated } = await auth();
  const account = isAuthenticated ? await getCurrentUser() : null;
  if (!account || account.role !== "seeker")
    return new Response("Unauthorized", { status: 401 });

  const since = Number(new URL(request.url).searchParams.get("since") ?? 0);
  const encoder = new TextEncoder();
  const userId = account.id;

  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      let last = since;
      const send = (data: string) =>
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      send(String(last));
      while (Date.now() - startedAt < maxMs && !request.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, pollMs));
        try {
          const version = await seekerApplicationsVersion(userId);
          if (version > last) {
            last = version;
            send(String(version));
          } else {
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
          }
        } catch {
          break;
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
