import { createArenaEventStream } from "@/lib/sse";
import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const feed = await arenaRepository.getProjectFeed(slug);

  return new Response(createArenaEventStream(request, feed, slug), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
