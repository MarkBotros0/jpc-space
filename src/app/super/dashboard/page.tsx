import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { computeAtRiskStudents } from "@/lib/engagement";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/students/stat-card";
import { UpcomingEventsCard } from "@/components/events/upcoming-events-card";

export const metadata = { title: "Dashboard" };

export default async function SuperDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER"]);

  const [userCount, activeSeasonCount, activeStudentCount] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.season.count({ where: { status: "ACTIVE", deletedAt: null } }),
    db.user.count({ where: { role: "STUDENT", deletedAt: null } }),
  ]);

  const activeSeason = await db.season.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    select: { id: true, title: true },
    orderBy: { startDate: "desc" },
  });
  const atRisk = activeSeason ? await computeAtRiskStudents(activeSeason.id) : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Super Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Global system overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total users" value={userCount} href="/super/users" />
        <StatCard label="Active seasons" value={activeSeasonCount} href="/super/seasons" />
        <StatCard label="Active students" value={activeStudentCount} href="/super/students" />
      </div>

      {/* Upcoming JPC events */}
      <UpcomingEventsCard includeAlumniOnly={true} />

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Users", href: "/super/users" },
            { label: "Seasons", href: "/super/seasons" },
            { label: "Students", href: "/super/students" },
            { label: "Events", href: "/super/events" },
          ] as const
        ).map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-bold text-brand-navy-900 shadow-[var(--shadow-soft)] transition-all hover:border-brand-teal-300 hover:text-brand-teal-700 dark:text-foreground dark:hover:text-brand-teal-300"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* At-risk students */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <AlertTriangle className="size-4 text-error-500" />
          <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">Students at risk</p>
          {activeSeason && (
            <p className="ml-1 text-xs text-muted-foreground/70">{activeSeason.title}</p>
          )}
          {atRisk.length > 0 && (
            <span className="ml-auto rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-700 dark:bg-error-950 dark:text-error-200">
              {atRisk.length}
            </span>
          )}
        </div>
        {!activeSeason ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={AlertTriangle}
              title="No active season"
              description="Create an active season to see at-risk data."
            />
          </div>
        ) : atRisk.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={AlertTriangle}
              title="No students at risk"
              description="All students are within their absence budget."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {atRisk.map((s) => (
              <li key={s.userId}>
                <Link
                  href={`/super/students/${s.userId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-navy-900 dark:text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.absentCount} absent · {s.lateCount} late</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-error-600 dark:text-error-400">+{s.minutesOver} min</p>
                    <p className="text-[10px] text-muted-foreground/70">over budget</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
