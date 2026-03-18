import Link from "next/link";
import { ArrowUpRight, RadioTower } from "lucide-react";

import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  seasonSlug: string;
  className?: string;
}

export function SiteHeader({ seasonSlug, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/10 bg-[rgba(7,10,20,0.72)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full border border-orange-400/40 bg-orange-500/15 text-orange-200 shadow-[0_0_28px_rgba(249,115,22,0.35)]">
            <RadioTower className="size-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-zinc-400">
              Bags Arena
            </div>
            <div className="font-display text-lg text-white">
              House League
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href={`/season/${seasonSlug}`}>Leaderboard</Link>
          <Link href={`/season/${seasonSlug}/arena`}>Live Arena</Link>
          <Link href="/admin">Admin</Link>
        </nav>

        <Link
          href={`/season/${seasonSlug}/arena`}
          className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-100 transition hover:bg-orange-500/20"
        >
          Watch now
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}
