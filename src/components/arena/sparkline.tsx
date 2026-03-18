import { useId } from "react";

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
  const chartId = useId().replace(/[:]/g, "");
  const gradientId = `sparkline-${chartId}`;
  const areaId = `sparkline-area-${chartId}`;
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
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-16 w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.38" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={areaId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.24" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${areaId})`} points={areaPoints} />
      <polyline
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      {values.map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;

        return (
          <circle
            key={`${chartId}-${index}`}
            cx={x}
            cy={y}
            r="1.5"
            fill={stroke}
            opacity={index === values.length - 1 ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}
