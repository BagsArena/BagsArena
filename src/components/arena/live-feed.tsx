"use client";

import { useEffect, useState } from "react";

import type { ArenaEvent } from "@/lib/arena/types";
import { formatRelativeTime } from "@/lib/utils";

interface LiveFeedProps {
  endpoint: string;
  initialEvents: ArenaEvent[];
}

export function LiveFeed({ endpoint, initialEvents }: LiveFeedProps) {
  const [events, setEvents] = useState(initialEvents);

  useEffect(() => {
    const source = new EventSource(endpoint);

    const handler = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as ArenaEvent;
      setEvents((current) => [payload, ...current].slice(0, 12));
    };

    source.addEventListener("arena-event", handler as EventListener);
    source.onmessage = handler;

    return () => {
      source.close();
    };
  }, [endpoint]);

  return (
    <div className="glass-panel rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="arena-kicker">Live feed</p>
          <h3 className="mt-2 font-display text-2xl text-white">Arena stream</h3>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-200">
          SSE online
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-1 flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-white">{event.title}</h4>
              <span className="text-xs text-zinc-500">
                {formatRelativeTime(event.createdAt)}
              </span>
            </div>
            <p className="text-sm leading-6 text-zinc-300">{event.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
