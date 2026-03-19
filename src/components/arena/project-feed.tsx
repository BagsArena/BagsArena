"use client";

import { useEffect, useState } from "react";

import type { ArenaEvent } from "@/lib/arena/types";
import { formatEventCategoryLabel, formatRelativeTime } from "@/lib/utils";

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
      {events.map((event, index) => (
        <div
          key={event.id}
          className="ui-feed-row reveal-up"
          style={{ animationDelay: `${0.05 * (index + 1)}s` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="ui-feed-dot mt-2 shrink-0" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ui-chip !bg-[color:var(--surface-soft)]">
                    {formatEventCategoryLabel(event.category)}
                  </span>
                  <h4 className="text-sm font-semibold text-[color:var(--foreground)]">
                    {event.title}
                  </h4>
                </div>
                <p className="ui-command mt-3">event stream / {event.projectId.slice(0, 6)}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {event.detail}
                </p>
              </div>
            </div>
            <span className="ui-browser-tag shrink-0 !text-[10px]">
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
