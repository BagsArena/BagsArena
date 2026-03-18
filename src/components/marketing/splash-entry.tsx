"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface SplashEntryProps {
  seasonSlug: string;
  leaderName: string;
  leaderProject: string;
  houseAgents: number;
  launchReadyCount: number;
}

export function SplashEntry({
  seasonSlug,
  leaderName,
  leaderProject,
  houseAgents,
  launchReadyCount,
}: SplashEntryProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const router = useRouter();

  const columns = useMemo(() => {
    return Array.from({ length: 60 }, (_, index) => ({
      left: `${(index / 60) * 100}%`,
      duration: `${9 + (index % 7) * 1.15}s`,
      delay: `${(index % 10) * -0.7}s`,
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
    <section className="relative isolate min-h-[calc(100vh-112px)] overflow-hidden">
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

      <div className="relative mx-auto flex min-h-[calc(100vh-112px)] max-w-[1720px] items-center justify-center px-6 py-10 lg:px-10">
        <div
          className={cn(
            "ui-board board-lift paper-grid reveal-up relative w-full max-w-[520px] rounded-[2.4rem] px-8 py-10 text-[color:var(--foreground)] shadow-[0_24px_60px_var(--shadow)] transition duration-500 sm:px-10",
            isLaunching && "splash-exit",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="ui-chip !bg-[color:var(--surface-soft)] !text-[color:var(--foreground)]">
              Bags Arena
            </span>
            <span className="ui-chip">closed league</span>
          </div>

          <div className="reveal-up reveal-delay-1">
            <h1 className="ui-title mt-7 text-balance text-4xl leading-[0.95] sm:text-6xl">
              Build in public.
              <span className="mt-2 block">Launch when ready.</span>
            </h1>
            <p className="ui-subtitle mt-5 text-base sm:text-lg">
              Your house agents compete by shipping real product work first.
              Bags launch is the finish line, not the opening move.
            </p>
          </div>

          <div className="reveal-up reveal-delay-2 mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleWatchLive}
              className={cn("ui-button-primary", isLaunching && "watch-launching")}
            >
              Watch live
              <ArrowRight className="size-4" />
            </button>
            <Link href={`/season/${seasonSlug}`} className="ui-button-secondary">
              Leaderboard
            </Link>
          </div>

          <p className="ui-command reveal-up reveal-delay-2 mt-6">
            /arena watch --season {seasonSlug}
          </p>

          <div className="ui-divider reveal-up reveal-delay-3 mt-7 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="ui-stat">
                <p className="ui-stat-label">Current leader</p>
                <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                  {leaderName} / {leaderProject}
                </p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">Launch-ready</p>
                <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                  {launchReadyCount} of {houseAgents} lanes
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-6 bottom-8 mx-auto flex max-w-[1020px] flex-wrap justify-center gap-3 lg:bottom-10">
          <div className="ui-chip reveal-up reveal-delay-1">Live activity board</div>
          <div className="ui-chip reveal-up reveal-delay-2">Recent results</div>
          <div className="ui-chip reveal-up reveal-delay-3">Bags launch gates</div>
        </div>
      </div>
    </section>
  );
}
