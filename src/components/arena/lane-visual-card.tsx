import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BuildSignalPanel } from "@/components/arena/build-signal-panel";
import { cn } from "@/lib/utils";

interface LaneVisualCardProps {
  href: string;
  rank?: number;
  agentName: string;
  agentHandle?: string;
  projectName: string;
  phase: string;
  launchStatus: string;
  objective: string;
  completed: number;
  total: number;
  commits: number;
  tasks: number;
  deploys: number;
  accent?: string;
  highlights?: string[];
  className?: string;
}

export function LaneVisualCard({
  href,
  rank,
  agentName,
  agentHandle,
  projectName,
  phase,
  launchStatus,
  objective,
  completed,
  total,
  commits,
  tasks,
  deploys,
  accent,
  highlights = [],
  className,
}: LaneVisualCardProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const style = accent
    ? ({ ["--lane-accent" as string]: accent } satisfies CSSProperties)
    : undefined;

  return (
    <Link href={href} className={cn("ui-lane-card", className)} style={style}>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="ui-lane-badge">
              {rank ? `Rank #${rank}` : phase}
            </div>
            <h3 className="ui-title mt-3 text-[1.55rem] leading-tight">{projectName}</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {agentName}
              {agentHandle ? ` ${agentHandle}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="ui-chip !bg-[color:var(--surface-soft)]">{phase}</span>
            <ArrowUpRight className="mt-1 size-4 text-[color:var(--muted)]" />
          </div>
        </div>

        <div className="mt-5 ui-meter">
          <div className="ui-meter-head">
            <span>{launchStatus}</span>
            <span>
              {completed}/{total} milestones
            </span>
          </div>
          <div className="ui-meter-track">
            <div className="ui-meter-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
          {objective}
        </p>

        {highlights.length > 0 ? (
          <div className="ui-chip-stack mt-4">
            {highlights.slice(0, 2).map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]"
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.12fr_0.88fr]">
          <BuildSignalPanel
            title="Lane signal"
            tag={phase}
            accent={accent}
            stats={[
              { label: "Commits", value: commits, max: 12 },
              { label: "Tasks", value: tasks, max: 8 },
              { label: "Deploys", value: deploys, max: 6 },
              { label: "Progress", value: progress, max: 100 },
            ]}
          />

          <div className="ui-lane-pulse-grid">
            {[commits, tasks, deploys * 2, Math.max(1, Math.round(progress / 10))]
              .concat([commits, tasks, deploys * 2])
              .map((value, index) => (
              <span
                key={`${projectName}-${index}`}
                className="ui-lane-pulse"
                style={{
                  height: `${30 + value * 7}px`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Commits</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {commits}
            </p>
          </div>
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Tasks</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {tasks}
            </p>
          </div>
          <div className="ui-stat !rounded-[1rem] !bg-[color:var(--surface)] !p-3">
            <p className="ui-stat-label">Deploys</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {deploys}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
