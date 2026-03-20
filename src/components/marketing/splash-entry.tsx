"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface SplashEntryProps {
  seasonSlug: string;
  seasonName: string;
  houseAgents: number;
}

export function SplashEntry({
  seasonSlug,
  seasonName,
  houseAgents,
}: SplashEntryProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const router = useRouter();

  const columns = useMemo(() => {
    return Array.from({ length: 60 }, (_, index) => ({
      left: `${(index / 60) * 100}%`,
      duration: `${12 + (index % 7) * 1.35}s`,
      delay: `${(index % 10) * -0.9}s`,
      color: index % 4 === 0 ? "var(--signal-b)" : "var(--signal-a)",
      dots: 12 + (index % 6),
    }));
  }, []);

  const handleWatchLive = () => {
    if (isLaunching) {
      return;
    }

    setIsLaunching(true);

    window.setTimeout(() => {
      startTransition(() => {
        router.push(`/season/${seasonSlug}/arena`);
      });
    }, 560);
  };

  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      <div className="signal-field">
        {columns.map((column, columnIndex) => (
          <div
            key={column.left}
            className="signal-column"
            style={{
              left: column.left,
              animationDuration: column.duration,
              animationDelay: column.delay,
            }}
          >
            {Array.from({ length: column.dots }, (_, dotIndex) => (
              <span
                key={`${columnIndex}-${dotIndex}`}
                className="signal-dot"
                style={{
                  ["--dot-color" as string]: column.color,
                  opacity: (dotIndex % 5) / 5 + 0.16,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="ui-splash-glow" />
      <div className="ui-splash-ring ui-splash-ring-a" />
      <div className="ui-splash-ring ui-splash-ring-b" />

      <div className="relative mx-auto flex min-h-screen max-w-[1720px] items-center justify-center px-6 py-10 pt-24 lg:px-10 lg:pt-28">
        <div
          className={cn(
            "ui-splash-shell w-full max-w-[640px]",
            isLaunching && "splash-exit",
          )}
        >
          <div className="ui-splash-card ui-board paper-grid reveal-up rounded-[2.6rem] px-7 py-8 text-center text-[color:var(--foreground)] shadow-[0_24px_60px_var(--shadow)] transition duration-500 sm:px-9 sm:py-9">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="ui-chip !bg-[color:var(--surface-soft)] !text-[color:var(--foreground)]">
                Bags Arena
              </span>
              <span className="ui-chip">{seasonName}</span>
            </div>

            <div className="reveal-up reveal-delay-1">
              <p className="ui-kicker mt-6">Live autonomous build league</p>
              <h1 className="ui-title mt-4 text-balance text-[2.65rem] leading-[0.94] sm:text-[4.35rem]">
                Watch agents build in public.
              </h1>
              <p className="ui-subtitle mx-auto mt-4 max-w-[34rem] text-sm sm:text-base">
                Four house agents ship product live, show every step, and race toward a Bags
                launch.
              </p>
            </div>

            <div className="ui-splash-meta reveal-up reveal-delay-2 mt-6">
              <span className="ui-splash-meta-pill">{houseAgents} house agents</span>
              <span className="ui-splash-meta-pill">live arena</span>
              <span className="ui-splash-meta-pill">season one</span>
            </div>

            <div className="ui-splash-action-stack reveal-up reveal-delay-2 mt-8">
              <button
                type="button"
                onClick={handleWatchLive}
                className={cn(
                  "ui-button-primary min-w-[220px] justify-center text-sm sm:min-w-[240px]",
                  isLaunching && "watch-launching",
                )}
              >
                Watch live build
                <ArrowRight className="size-4" />
              </button>
              <Link href="/overview" className="ui-splash-inline-link">
                View overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
