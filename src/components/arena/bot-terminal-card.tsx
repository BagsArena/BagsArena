interface BotTerminalStat {
  label: string;
  value: number;
  max: number;
}

interface BotTerminalCardProps {
  label: string;
  phase: string;
  objective: string;
  lines: string[];
  stats: BotTerminalStat[];
  projectName?: string;
  status?: string;
  highlights?: string[];
}

export function BotTerminalCard({
  label,
  phase,
  objective,
  lines,
  stats,
  projectName,
  status,
  highlights = [],
}: BotTerminalCardProps) {
  return (
    <div className="ui-terminal">
      <div className="ui-terminal-header">
        <div className="flex items-center gap-3">
          <div className="ui-terminal-traffic">
            <span className="bg-[#ff5f57]" />
            <span className="bg-[#febc2e]" />
            <span className="bg-[color:var(--accent)]" />
          </div>
          <div>
            <p className="ui-command">{label}</p>
            {projectName ? (
              <p className="ui-terminal-soft mt-1 text-[11px] uppercase tracking-[0.16em]">
                {projectName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status ? <span className="ui-terminal-tag">{status}</span> : null}
          <span className="ui-terminal-tag">{phase}</span>
        </div>
      </div>

      <div className="ui-terminal-body">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          <div>
            <p className="ui-command ui-terminal-soft">current objective</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--code-fg)]">{objective}</p>

            <div className="mt-5 space-y-2">
              {lines.slice(0, 6).map((line, index) => (
                <div key={`${index}-${line}`} className="ui-terminal-line">
                  <span className="ui-terminal-line-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="ui-terminal-prompt">$</span>
                  <span className={line.startsWith("$") ? "ui-terminal-muted" : ""}>
                    {line.replace(/^\$\s*/, "")}
                  </span>
                </div>
              ))}

              <div className="ui-terminal-line">
                <span className="ui-terminal-line-number">07</span>
                <span className="ui-terminal-prompt">&gt;</span>
                <span className="flex items-center gap-3 text-[color:var(--code-fg)]">
                  awaiting next diff
                  <span className="ui-terminal-cursor" />
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="ui-terminal-panel">
              <p className="ui-command ui-terminal-soft">runtime stack</p>
              <div className="ui-terminal-stack mt-4">
                <div className="ui-terminal-stack-card">
                  <span className="ui-terminal-soft">phase</span>
                  <strong>{phase}</strong>
                </div>
                <div className="ui-terminal-stack-card">
                  <span className="ui-terminal-soft">status</span>
                  <strong>{status ?? "running"}</strong>
                </div>
                <div className="ui-terminal-stack-card">
                  <span className="ui-terminal-soft">outputs</span>
                  <strong>{highlights.length || 0}</strong>
                </div>
              </div>
            </div>

            <div className="ui-terminal-panel">
              <p className="ui-command ui-terminal-soft">live outputs</p>
              <div className="ui-chip-stack mt-4">
                {highlights.slice(0, 4).map((highlight) => (
                  <span key={highlight} className="ui-terminal-tag">
                    {highlight}
                  </span>
                ))}
                {highlights.length === 0 ? (
                  <span className="ui-terminal-tag">preview pending</span>
                ) : null}
              </div>
            </div>

            <div className="ui-terminal-panel">
              <p className="ui-command ui-terminal-soft">signal matrix</p>
              <div className="ui-terminal-matrix mt-4">
                {Array.from({ length: 12 }, (_, index) => (
                  <span
                    key={index}
                    className="ui-terminal-matrix-cell"
                    style={{ animationDelay: `${index * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 ui-terminal-bars md:grid-cols-3">
          {stats.map((stat) => {
            const width = Math.min(100, Math.max(8, (stat.value / Math.max(stat.max, 1)) * 100));

            return (
              <div key={stat.label} className="ui-terminal-bar">
                <div className="ui-terminal-meter-head">
                  <span>{stat.label}</span>
                  <span>{stat.value}</span>
                </div>
                <div className="ui-terminal-track">
                  <div className="ui-terminal-fill" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
