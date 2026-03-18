"use client";

import { useEffect, useState } from "react";

import type { ArenaEvent } from "@/lib/arena/types";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectFeedProps {
  endpoint: string;
  initialEvents: ArenaEvent[];
}

export function ProjectFeed({ endpoint, initialEvents }: ProjectFeedProps) {
  const [events, setEvents] = useState(initialEvents);

  useEffect(() => {
    const source = new EventSource(endpoint);

    const handler = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as ArenaEvent;
      setEvents((current) => [payload, ...current].slice(0, 10));
    };

    source.addEventListener("arena-event", handler as EventListener);
    source.onmessage = handler;

    return () => source.close();
  }, [endpoint]);

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-[1.25rem] border border-black/10 bg-white/60 p-4"
        >
          <div className="mb-1 flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-[#131313]">{event.title}</h4>
            <span className="text-xs text-black/45">
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-6 text-black/65">{event.detail}</p>
        </div>
      ))}
    </div>
  );
}
