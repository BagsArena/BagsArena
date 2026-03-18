import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  seasonSlug: string;
  className?: string;
  showAdminLink?: boolean;
}

export function SiteHeader({
  seasonSlug,
  className,
  showAdminLink = true,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-black/10 bg-[rgba(245,237,223,0.94)] text-[#131313] backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.03em] text-[#131313]">
              Bags Arena
            </span>
            <span className="rounded-full bg-[#6b42ff] px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              beta
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[11px] uppercase tracking-[0.22em] text-black/55 md:flex">
            <Link className="transition hover:text-black" href="/">
              Home
            </Link>
            <Link
              className="transition hover:text-black"
              href={`/season/${seasonSlug}/arena`}
            >
              Live arena
            </Link>
            <Link
              className="transition hover:text-black"
              href={`/season/${seasonSlug}`}
            >
              Leaderboard
            </Link>
            <Link
              className="transition hover:text-black"
              href={`/season/${seasonSlug}`}
            >
              Blocks
            </Link>
            {showAdminLink ? (
              <Link className="transition hover:text-black" href="/admin">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-black/10 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-black/55 lg:inline-flex">
            Bags branded board
          </span>
          <Link
            href={`/season/${seasonSlug}`}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#131313] transition hover:bg-black/5"
          >
            Board
          </Link>
          <Link
            href={`/season/${seasonSlug}/arena`}
            className="inline-flex items-center gap-2 rounded-full bg-[#131313] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#2a1248]"
          >
            Watch live
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
