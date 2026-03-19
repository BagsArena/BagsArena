import { cn } from "@/lib/utils";

interface StatusTickerItem {
  label: string;
  status: string;
}

interface StatusTickerProps {
  items: StatusTickerItem[];
  className?: string;
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "live":
    case "final":
      return "text-[color:var(--accent-strong)]";
    case "launch-ready":
    case "waiting":
      return "text-[color:var(--accent-strong)]";
    case "building":
    case "coding":
    case "deploying":
      return "text-[color:var(--foreground)]";
    default:
      return "text-[color:var(--muted)]";
  }
}

export function StatusTicker({ items, className }: StatusTickerProps) {
  const track = [...items, ...items];

  return (
    <div className={cn("status-ticker overflow-hidden", className)}>
      <div className="status-ticker-shell px-4 py-2 lg:px-6">
        <div className="status-ticker-label">
          <span className="ui-feed-dot !size-2 shrink-0" />
          live pulse
        </div>

        <div className="status-ticker-viewport">
          <div className="ticker-track gap-8 px-3">
            {track.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] opacity-70" />
                <span className={cn("font-semibold", getStatusClass(item.status))}>
                  {item.status}
                </span>
                <span className="text-[color:var(--muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
