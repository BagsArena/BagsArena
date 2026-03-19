"use client";

import { useEffect, useState } from "react";

import type { ArenaEvent } from "@/lib/arena/types";
import { formatEventCategoryLabel, formatRelativeTime } from "@/lib/utils";

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
    <div className="ui-board rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="ui-kicker">Live feed</p>
          <h3 className="ui-title mt-2 text-2xl">Arena stream</h3>
        </div>
        <div className="ui-chip live-pulse gap-2 !pl-3">
          SSE online
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="ui-feed-row"
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
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {event.detail}
                  </p>
                </div>
              </div>
              <span className="text-xs text-[color:var(--muted)]">
                {formatRelativeTime(event.createdAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
