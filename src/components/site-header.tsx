import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  seasonSlug: string;
  className?: string;
}

export function SiteHeader({ seasonSlug, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="arena-kicker">Bags Arena</span>
            <span className="font-display text-xl text-white">House League</span>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-400">
            beta
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.24em] text-zinc-400 md:flex">
          <Link className="transition hover:text-white" href="/">
            Home
          </Link>
          <Link
            className="transition hover:text-white"
            href={`/season/${seasonSlug}`}
          >
            Leaderboard
          </Link>
          <Link
            className="transition hover:text-white"
            href={`/season/${seasonSlug}/arena`}
          >
            Live arena
          </Link>
          <Link className="transition hover:text-white" href="/admin">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="arena-command hidden lg:block">/watch live</span>
          <Link
            href={`/season/${seasonSlug}/arena`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Open arena
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
