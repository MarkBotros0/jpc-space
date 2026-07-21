import Link from "next/link";
import { format } from "date-fns";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { computeAttendanceBudget } from "@/lib/engagement";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import type { AttendanceStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Attendance" };

function statusBadge(status: AttendanceStatus | null) {
  if (!status) return <Badge variant="outline">No record</Badge>;
  if (status === "PRESENT") return <Badge variant="success">Present</Badge>;
  if (status === "LATE") return <Badge variant="warning">Late</Badge>;
  if (status === "ABSENT") return <Badge variant="error">Absent</Badge>;
  return null;
}

export default async function StudentAttendancePage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const seasonId = user.activeSeasonId;

  if (!seasonId) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <Link href="/student/dashboard" className="text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-black text-brand-navy-900 dark:text-foreground">Attendance</h1>
        </div>
        <EmptyState icon={Calendar} title="Not enrolled" description="Enroll in a season to track attendance." />
      </div>
    );
  }

  const [budget, season, pastSessions] = await Promise.all([
    computeAttendanceBudget(user.userId, seasonId),
    db.season.findUnique({
      where: { id: seasonId },
      select: {
        absenceWeightMinutes: true,
        absenceBudgetMinutes: true,
      },
    }),
    db.session.findMany({
      where: { seasonId, startsAt: { lte: new Date() } },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        checkInOpenAt: true,
        attendance: {
          where: { studentUserId: user.userId },
          select: {
            status: true,
            checkedInAt: true,
            markedAt: true,
            lateMinutes: true,
          },
        },
      },
    }),
  ]);

  const budgetPct = budget?.budgetPct ?? 0;
  const minutesUsed = budget?.minutesUsed ?? 0;
  const budgetMinutes = budget?.budgetMinutes ?? (season?.absenceBudgetMinutes ?? 180);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div>
        <Link href="/student/dashboard" className="text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-black text-brand-navy-900 dark:text-foreground">Attendance</h1>
      </div>

      {/* Budget hero */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={budgetPct}
            label={`Absence budget ${budgetPct}% used`}
            indicatorClassName={
              budgetPct >= 100
                ? "stroke-[var(--color-error-500)]"
                : budgetPct >= 70
                  ? "stroke-[var(--color-warning-500)]"
                  : undefined
            }
          >
            <span className="text-2xl font-black text-brand-navy-900 dark:text-foreground">
              {budgetPct}%
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              used
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700 dark:text-brand-teal-300">
              Absence budget
            </p>
            <p className="mt-1 text-lg font-black text-brand-navy-900 dark:text-foreground">
              {minutesUsed} of {budgetMinutes} min
            </p>
            {season && (
              <p className="text-xs text-muted-foreground">
                Absent = {season.absenceWeightMinutes} min · Late = actual minutes late
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Session breakdown */}
      {pastSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions yet"
          description="Past sessions will appear here."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <p className="px-4 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Session history
          </p>
          <ul className="mt-2 divide-y divide-border">
            {pastSessions.map((s) => {
              const record = s.attendance[0] ?? null;
              const status = record?.status ?? null;

              // Actual minutes late are recorded on the attendance row.
              const lateMinutes: number | null =
                status === "LATE" ? (record?.lateMinutes ?? null) : null;

              // Budget cost for this session
              let costMinutes: number | null = null;
              if (status === "ABSENT" && season) costMinutes = season.absenceWeightMinutes;
              if (status === "LATE") costMinutes = record?.lateMinutes ?? null;

              return (
                <li key={s.id} className="flex items-start gap-3 px-4 py-3 last:pb-4">
                  <div className="mt-0.5 flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-navy-900 dark:text-foreground">
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {format(s.startsAt, "EEE, MMM d, yyyy · h:mm a")}
                    </p>
                    {lateMinutes !== null && lateMinutes > 0 && (
                      <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-300">
                        {lateMinutes} min late
                      </p>
                    )}
                    {costMinutes !== null && costMinutes > 0 && (
                      <p className="mt-0.5 text-xs text-error-600 dark:text-error-400">
                        −{costMinutes} min from budget
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {statusBadge(status)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
