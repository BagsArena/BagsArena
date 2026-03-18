import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
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
        "sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--ticker)] text-[color:var(--foreground)] backdrop-blur-xl transition-colors duration-300",
        className,
      )}
    >
      <div className="ui-shell flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.03em]">Bags Arena</span>
            <span className="rounded-full bg-[color:var(--accent)] px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-[color:var(--accent-contrast)]">
              beta
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] md:flex">
            <Link className="transition hover:text-[color:var(--foreground)]" href="/">
              Home
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
            <Link
              className="transition hover:text-[color:var(--foreground)]"
              href={`/season/${seasonSlug}/arena`}
            >
              Blocks
            </Link>
            {showAdminLink ? (
              <Link
                className="transition hover:text-[color:var(--foreground)]"
                href="/admin"
              >
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={`/season/${seasonSlug}`} className="ui-button-soft">
            Board
          </Link>
          <Link href={`/season/${seasonSlug}/arena`} className="ui-button-primary">
            Watch live
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
