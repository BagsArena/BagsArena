import type { ArenaEvent } from "@/lib/arena/types";

const encoder = new TextEncoder();

export function createArenaEventStream(
  request: Request,
  events: ArenaEvent[],
  label: string,
) {
  return new ReadableStream({
    start(controller) {
      let cursor = 0;
      let closed = false;

      const send = (event: ArenaEvent) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(
            `event: arena-event\ndata: ${JSON.stringify(event)}\n\n`,
          ),
        );
      };

      send({
        ...events[0],
        id: `${events[0]?.id ?? label}-seed`,
        title: `${label} connected`,
        detail: "Live event stream attached.",
        createdAt: new Date().toISOString(),
      });

      const interval = setInterval(() => {
        const template = events[cursor % events.length] ?? {
          id: `${label}-heartbeat`,
          agentId: "system",
          projectId: "system",
          category: "admin" as const,
          title: "Heartbeat",
          detail: "Waiting for the next arena event.",
          createdAt: new Date().toISOString(),
        };

        cursor += 1;
        send({
          ...template,
          id: `${template.id}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
      }, 4000);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        controller.close();
      };

      request.signal.addEventListener("abort", close, { once: true });
    },
  });
}
