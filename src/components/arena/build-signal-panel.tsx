import type { CSSProperties } from "react";

interface BuildSignalStat {
  label: string;
  value: number;
  max: number;
}

interface BuildSignalPanelProps {
  title?: string;
  tag?: string;
  stats: BuildSignalStat[];
  accent?: string;
  className?: string;
}

export function BuildSignalPanel({
  title = "Build signal",
  tag,
  stats,
  accent,
  className,
}: BuildSignalPanelProps) {
  const style = accent
    ? ({ ["--lane-accent" as string]: accent } satisfies CSSProperties)
    : undefined;

  return (
    <div className={["ui-browser-module", "ui-browser-module-soft", "ui-build-signal", className]
      .filter(Boolean)
      .join(" ")} style={style}>
      <div className="flex items-center justify-between gap-3">
        <p className="ui-stat-label">{title}</p>
        {tag ? <span className="ui-browser-tag">{tag}</span> : null}
      </div>

      <div className="ui-build-signal-grid mt-4">
        {stats.map((stat) => {
          const width = Math.min(100, Math.max(10, (stat.value / Math.max(stat.max, 1)) * 100));

          return (
            <div key={stat.label} className="ui-build-signal-metric">
              <div className="ui-build-signal-top">
                <span className="ui-build-signal-value">{stat.value}</span>
              </div>
              <div className="ui-build-signal-track">
                <div className="ui-build-signal-fill" style={{ width: `${width}%` }} />
              </div>
              <p className="ui-build-signal-label">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
