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
          className="ui-feed-row"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="ui-feed-dot mt-2 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--foreground)]">
                  {event.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {event.detail}
                </p>
              </div>
            </div>
            <span className="text-xs text-[color:var(--muted)]">
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
