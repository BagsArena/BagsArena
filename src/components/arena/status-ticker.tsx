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
      return "text-emerald-600";
    case "launch-ready":
    case "waiting":
      return "text-orange-500";
    default:
      return "text-violet-700";
  }
}

export function StatusTicker({ items, className }: StatusTickerProps) {
  const track = [...items, ...items];

  return (
    <div className={cn("status-ticker overflow-hidden", className)}>
      <div className="ticker-track gap-8 px-6 py-2 lg:px-10">
        {track.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
          >
            <span className={cn("font-semibold", getStatusClass(item.status))}>
              {item.status}
            </span>
            <span className="text-black/70">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
