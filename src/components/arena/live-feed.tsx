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
    <div className="paper-panel rounded-[1.75rem] p-5 text-[#131313]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="ink-kicker">Live feed</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#131313]">
            Arena stream
          </h3>
        </div>
        <div className="rounded-full border border-emerald-600/15 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-700">
          SSE online
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-[1.25rem] border border-black/10 bg-white/55 p-4"
          >
            <div className="mb-1 flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-[#131313]">{event.title}</h4>
              <span className="text-xs text-black/45">
                {formatRelativeTime(event.createdAt)}
              </span>
            </div>
            <p className="text-sm leading-6 text-black/65">{event.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
