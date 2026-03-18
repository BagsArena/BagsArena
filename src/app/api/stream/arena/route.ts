import { createArenaEventStream } from "@/lib/sse";
import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return new Response(
    createArenaEventStream(request, await arenaRepository.getArenaFeed(), "arena"),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    },
  );
}
