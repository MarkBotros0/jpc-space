import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  href?: string;
  variant?: "white" | "navy" | "teal";
  className?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  href,
  variant = "white",
  className,
}: StatCardProps) {
  const cls = cn(
    "flex h-full flex-col items-center justify-center gap-1 rounded-2xl p-4 text-center",
    href && "transition-opacity hover:opacity-80",
    variant === "white" &&
      "border border-border bg-card shadow-[var(--shadow-soft)]",
    variant === "navy" &&
      "bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 shadow-[0_4px_20px_rgba(31,50,96,0.25)] dark:from-brand-navy-800 dark:to-brand-navy-600 dark:ring-1 dark:ring-white/10",
    variant === "teal" &&
      "bg-brand-teal-100 ring-1 ring-brand-teal-200 dark:bg-brand-teal-950 dark:ring-brand-teal-900",
    className,
  );
  const inner = (
    <>
      <p
        className={cn(
          "flex items-center justify-center gap-1 text-3xl font-black leading-none",
          variant === "white" && "text-brand-navy-900 dark:text-foreground",
          variant === "navy" && "text-white",
          variant === "teal" && "text-brand-teal-900 dark:text-brand-teal-100",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest",
          variant === "white" && "text-muted-foreground/70",
          variant === "navy" && "text-brand-teal-300",
          variant === "teal" && "text-brand-teal-700 dark:text-brand-teal-300",
        )}
      >
        {label}
      </p>
      {sublabel && (
        <p
          className={cn(
            "text-[10px]",
            variant === "white" && "text-muted-foreground/70",
            variant === "navy" && "text-white/40",
            variant === "teal" && "text-brand-teal-600 dark:text-brand-teal-400",
          )}
        >
          {sublabel}
        </p>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
