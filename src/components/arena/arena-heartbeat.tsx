"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function shouldSkipPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/preview/");
}

export function ArenaHeartbeat() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || shouldSkipPath(pathname)) {
      return;
    }

    let cancelled = false;

    async function tick() {
      if (cancelled || document.hidden) {
        return;
      }

      try {
        const response = await fetch("/api/heartbeat", {
          method: "POST",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { updated?: boolean };

        if (!cancelled && payload.updated) {
          router.refresh();
        }
      } catch {
        // Ignore transient heartbeat failures on the client.
      }
    }

    const initialTimer = window.setTimeout(() => {
      void tick();
    }, 5_000);

    const interval = window.setInterval(() => {
      void tick();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
