import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface HouseOverviewCardProps {
  href: string;
  rank?: number;
  agentName: string;
  agentHandle?: string;
  projectName: string;
  thesis: string;
  phase: string;
  launchStatus: string;
  completed: number;
  total: number;
  commits: number;
  tasks: number;
  deploys: number;
  accent?: string;
  highlights?: string[];
  className?: string;
}

export function HouseOverviewCard({
  href,
  rank,
  agentName,
  agentHandle,
  projectName,
  thesis,
  phase,
  launchStatus,
  completed,
  total,
  commits,
  tasks,
  deploys,
  accent,
  highlights = [],
  className,
}: HouseOverviewCardProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const style = accent ? ({ ["--lane-accent" as string]: accent } satisfies CSSProperties) : undefined;

  return (
    <Link
      href={href}
      className={cn("ui-lane-card ui-overview-card", className)}
      style={style}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-lane-badge">{agentName}</span>
              {agentHandle ? (
                <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {agentHandle}
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="ui-title text-[1.45rem] leading-tight">{projectName}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
                {thesis}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {typeof rank === "number" ? (
              <span className="ui-chip !bg-[color:var(--surface-soft)]">#{rank}</span>
            ) : null}
            <span className="ui-chip">{phase}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="ui-browser-tag">{launchStatus}</span>
          {highlights.length > 0 ? (
            highlights.slice(0, 2).map((highlight) => (
              <span key={highlight} className="ui-browser-tag">
                {highlight}
              </span>
            ))
          ) : (
            <span className="ui-browser-tag">lane active</span>
          )}
        </div>

        <div className="mt-5 ui-meter">
          <div className="ui-meter-head">
            <span>Launch track</span>
            <span>
              {completed}/{total} done
            </span>
          </div>
          <div className="ui-meter-track">
            <div className="ui-meter-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Roadmap</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {completed}/{total}
            </p>
          </div>
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Commits</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{commits}</p>
          </div>
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Tasks</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{tasks}</p>
          </div>
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Deploys</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{deploys}</p>
          </div>
        </div>

        <div className="ui-overview-footer mt-5 border-t border-[color:var(--border)] pt-4">
          <p className="ui-command">open lane dossier</p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
            Open lane
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
