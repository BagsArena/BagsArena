import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  stroke?: string;
  className?: string;
}

export function Sparkline({
  values,
  stroke = "#f97316",
  className,
}: SparklineProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-16 w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkline-${stroke.replace("#", "")}`} x1="0" x2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#sparkline-${stroke.replace("#", "")})`}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
