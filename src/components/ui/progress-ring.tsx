import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0–100 */
  value: number;
  /** Diameter in px. */
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Override the indicator stroke (defaults to brand teal). */
  indicatorClassName?: string;
  /** Accessible description, e.g. "Season 90% complete". */
  label?: string;
  /** Centered content (the big number). */
  children?: React.ReactNode;
}

/**
 * Theme-adaptive circular progress indicator. Track follows the `--border`
 * token (so it flips light/dark); indicator is brand teal by default. Pure
 * SVG — safe to render in Server Components.
 */
export function ProgressRing({
  value,
  size = 104,
  strokeWidth = 9,
  className,
  indicatorClassName,
  label,
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(clamped)} percent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-[var(--border)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={cn(
            "stroke-[var(--color-brand-teal-500)] transition-[stroke-dasharray] duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
            indicatorClassName,
          )}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
          {children}
        </div>
      )}
    </div>
  );
}
