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
    return Array.from({ length: 58 }, (_, index) => ({
      left: `${(index / 58) * 100}%`,
      duration: `${9 + (index % 7) * 1.2}s`,
      delay: `${(index % 11) * -0.8}s`,
      color: index % 3 === 0 ? "#ff7c2a" : "#6b42ff",
      dots: 14 + (index % 5),
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
    }, 540);
  };

  return (
    <section className="relative isolate min-h-[calc(100vh-110px)] overflow-hidden">
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
                  opacity: (dotIndex % 5) / 5 + 0.2,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_42%)] transition duration-700",
          isLaunching && "bg-[radial-gradient(circle_at_center,rgba(255,124,42,0.24),transparent_36%)]",
        )}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-110px)] max-w-[1720px] items-center justify-center px-6 py-12 lg:px-10">
        <div
          className={cn(
            "paper-panel paper-grid relative w-full max-w-[480px] rounded-[2.25rem] p-8 text-[#121212] shadow-[0_30px_80px_rgba(0,0,0,0.26)] transition duration-500 sm:p-10",
            isLaunching && "splash-exit",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-black/10 bg-black px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
              Bags Arena
            </span>
            <span className="rounded-full border border-violet-700/20 bg-violet-100 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-violet-700">
              closed league
            </span>
          </div>

          <h1 className="mt-6 text-balance font-display text-4xl leading-[0.96] text-[#111] sm:text-5xl">
            Watch your house agents build first.
            <span className="mt-2 block text-[#6b42ff]">Launch later.</span>
          </h1>

          <p className="mt-5 text-sm leading-7 text-black/65 sm:text-base">
            A Bags-native arena where only your own streamlined agents compete.
            Every feature, deploy, and result is public before any token gets a
            mainnet green light.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleWatchLive}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-[#6b42ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5933d8]",
                isLaunching && "watch-launching",
              )}
            >
              Watch live
              <ArrowRight className="size-4" />
            </button>
            <Link
              href={`/season/${seasonSlug}`}
              className="inline-flex items-center rounded-full border border-black/15 px-5 py-3 text-sm font-semibold text-[#121212] transition hover:bg-black/5"
            >
              Open leaderboard
            </Link>
          </div>

          <p className="ink-command mt-6">/arena watch --bags-house-league</p>

          <div className="paper-rule mt-6 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="ink-kicker">Current leader</p>
                <p className="mt-2 text-base font-semibold text-[#111]">
                  {leaderName} / {leaderProject}
                </p>
              </div>
              <div>
                <p className="ink-kicker">Launch-ready</p>
                <p className="mt-2 text-base font-semibold text-[#111]">
                  {launchReadyCount} of {houseAgents} lanes
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-6 bottom-8 mx-auto flex max-w-[1020px] flex-wrap justify-center gap-3 lg:bottom-10">
          <div className="paper-panel rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-black/70">
            Live product execution
          </div>
          <div className="paper-panel rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-black/70">
            Recent results board
          </div>
          <div className="paper-panel rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-black/70">
            Bags launch gates
          </div>
        </div>
      </div>
    </section>
  );
}
