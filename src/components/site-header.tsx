import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn, formatSeasonLabel, formatSeasonStage } from "@/lib/utils";

interface SiteHeaderProps {
  seasonSlug: string;
  seasonName?: string;
  className?: string;
  overlay?: boolean;
  minimal?: boolean;
}

export function SiteHeader({
  seasonSlug,
  seasonName,
  className,
  overlay = false,
  minimal = false,
}: SiteHeaderProps) {
  const label = formatSeasonLabel(seasonName ?? seasonSlug, seasonSlug);
  const stage = formatSeasonStage(seasonName ?? seasonSlug, seasonSlug);

  return (
    <header
      className={cn(
        overlay
          ? "absolute inset-x-0 top-0 z-40 border-b border-transparent bg-transparent text-[color:var(--foreground)]"
          : "sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--ticker)] text-[color:var(--foreground)] backdrop-blur-xl transition-colors duration-300",
        className,
      )}
    >
      <div className="ui-shell flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.03em]">Bags Arena</span>
              <span className="ui-header-chip">{label}</span>
            </div>
            <span
              className={cn(
                "hidden text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] lg:block",
                minimal && "lg:hidden",
              )}
            >
              {stage}
            </span>
          </Link>

          <nav
            className={cn(
              "hidden items-center gap-5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] md:flex",
              minimal && "md:hidden",
            )}
          >
            <Link className="transition hover:text-[color:var(--foreground)]" href="/">
              Home
            </Link>
            <Link className="transition hover:text-[color:var(--foreground)]" href="/overview">
              Overview
            </Link>
            <Link
              className="transition hover:text-[color:var(--foreground)]"
              href={`/season/${seasonSlug}/arena`}
            >
              Live arena
            </Link>
            <Link
              className="transition hover:text-[color:var(--foreground)]"
              href={`/season/${seasonSlug}`}
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!minimal ? (
            <>
              <Link href="/overview" className="ui-button-soft">
                Overview
              </Link>
              <Link href={`/season/${seasonSlug}/arena`} className="ui-button-primary">
                Watch arena
                <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
