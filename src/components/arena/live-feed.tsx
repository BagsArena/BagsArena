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
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Stream
          </p>
          <h3 className="font-display text-xl text-white">Live arena feed</h3>
        </div>
        <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          SSE online
        </div>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-2xl border border-white/8 bg-black/20 p-4"
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
