import Link from "next/link";
import { Calendar, FileText, Sparkles, User } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/student/calendar", icon: Calendar, label: "Calendar" },
  { href: "/student/assignments", icon: FileText, label: "Assignments" },
  { href: "/student/history", icon: Sparkles, label: "History" },
  { href: "/student/profile", icon: User, label: "Profile" },
] as const;

export function StudentQuickNav({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {NAV_LINKS.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center shadow-[var(--shadow-soft)] transition-shadow duration-150 hover:shadow-[var(--shadow-pop)]"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-navy-50 text-brand-navy-700 dark:bg-brand-navy-800 dark:text-brand-navy-100">
            <Icon className="size-4" />
          </span>
          <span className="text-xs font-semibold text-brand-navy-900 dark:text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}
