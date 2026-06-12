import Link from "next/link";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { AlertTriangle, Flame, Sparkles } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { computeAttendanceBudget, computeAttendanceStreak } from "@/lib/engagement";
import { listAssignmentsForStudent } from "@/lib/assignments-query";
import { StaggerReveal } from "@/components/motion/stagger-reveal";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/students/stat-card";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const profile = await db.user.findUnique({
    where: { id: user.userId },
    select: {
      name: true,
      studentProfile: {
        select: {
          activeSeason: {
            select: { id: true, title: true, code: true },
          },
        },
      },
    },
  });

  const seasonId = user.activeSeasonId;
  const season = profile?.studentProfile?.activeSeason ?? null;

  const [nextSession, assignments, budget, streak, allSubmissions, weeksTotal, weeksCompleted] = seasonId
    ? await Promise.all([
        db.session.findFirst({
          where: { seasonId, startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            title: true,
            startsAt: true,
            location: true,
            youtubeUrl: true,
            durationMinutes: true,
          },
        }),
        listAssignmentsForStudent(user.userId, seasonId),
        computeAttendanceBudget(user.userId, seasonId),
        computeAttendanceStreak(user.userId, seasonId),
        db.submission.findMany({
          where: {
            studentUserId: user.userId,
            status: { in: ["SUBMITTED", "REVIEWED", "RETURNED"] },
            submittedAt: { not: null },
            assignment: { seasonId, deletedAt: null, dueAt: { not: null } },
          },
          select: {
            submittedAt: true,
            assignment: { select: { dueAt: true } },
          },
        }),
        db.session.count({ where: { seasonId } }),
        db.session.count({
          where: { seasonId, startsAt: { lte: new Date() } },
        }),
      ])
    : ([null, [], null, 0, [], 0, 0] as const);

  const pending = assignments.filter(
    (a) => a.status === "PENDING" || a.status === "DRAFT",
  );
  const lateCount = allSubmissions.filter(
    (s) => s.submittedAt != null && s.assignment.dueAt != null && s.submittedAt > s.assignment.dueAt!,
  ).length;

  const progressPct =
    weeksTotal > 0 ? Math.round((weeksCompleted / weeksTotal) * 100) : 0;
  const attendancePct = budget
    ? Math.max(0, Math.round(100 - budget.budgetPct))
    : null;
  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <StaggerReveal className="flex flex-col gap-3 md:gap-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">
          Hi, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {season
            ? pending.length > 0
              ? `${pending.length} ${pending.length === 1 ? "assignment needs" : "assignments need"} your attention.`
              : "You're all caught up this week."
            : "Welcome to JPC Space"}
        </p>
      </div>

      {/* ── Not enrolled ── */}
      {!season && (
        <>
          <EmptyState
            icon={Sparkles}
            title="Not enrolled yet"
            description="Contact your leader or admin to be enrolled in a season."
          />
          <div className="rounded-2xl bg-brand-teal-100 p-4 ring-1 ring-brand-teal-200 dark:bg-brand-teal-950 dark:ring-brand-teal-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700 dark:text-brand-teal-300">
              While you wait
            </p>
            <Link
              href="/student/profile"
              className="mt-1 block text-sm font-bold text-brand-teal-900 hover:underline dark:text-brand-teal-100"
            >
              Complete your profile →
            </Link>
          </div>
        </>
      )}

      {/* ── Active season ── */}
      {season && (
        <>
          {/* Hero: season progress ring */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-5">
              <ProgressRing value={progressPct} label={`Season ${progressPct}% complete`}>
                <span className="text-2xl font-black text-brand-navy-900 dark:text-foreground">
                  {progressPct}%
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  done
                </span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700 dark:text-brand-teal-300">
                  Current season
                </p>
                <p className="mt-1 truncate text-lg font-black text-brand-navy-900 dark:text-foreground">
                  {season.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Week {weeksCompleted} of {weeksTotal}
                  {progressPct >= 100
                    ? " · complete"
                    : ` · ${weeksTotal - weeksCompleted} ${
                        weeksTotal - weeksCompleted === 1 ? "week" : "weeks"
                      } to go`}
                </p>
              </div>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Absence budget"
              value={attendancePct !== null ? `${attendancePct}%` : "—"}
              sublabel="this season"
              href="/student/attendance"
            />
            <StatCard
              label="Streak"
              value={
                streak > 0 ? (
                  <span className="flex items-center gap-1">
                    <Flame className="size-6 text-warning-500" aria-hidden />
                    {streak}
                  </span>
                ) : (
                  streak
                )
              }
            />
            <StatCard
              label="Assignments"
              value={pending.length}
              sublabel={pending.length === 1 ? "pending" : "pending"}
              href="/student/assignments"
              variant={pending.length > 0 ? "teal" : "white"}
            />
          </div>
          {lateCount > 0 && (
            <div className="rounded-2xl bg-warning-50 p-3 ring-1 ring-warning-200 dark:bg-warning-950 dark:ring-warning-900">
              <p className="flex items-center gap-1.5 text-xs font-bold text-warning-800 dark:text-warning-200">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                {lateCount} assignment{lateCount !== 1 ? "s" : ""} submitted late this season
              </p>
            </div>
          )}

          {/* Next session */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Next session
            </p>
            {nextSession ? (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-teal-500" />
                  <div>
                    <Link
                      href={`/student/sessions/${nextSession.id}`}
                      className="text-sm font-bold text-brand-navy-900 hover:underline dark:text-foreground"
                    >
                      {nextSession.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {format(nextSession.startsAt, "EEE, MMM d · h:mm a")} ·{" "}
                      {nextSession.durationMinutes} min
                      {nextSession.location ? ` · ${nextSession.location}` : ""}
                    </p>
                    <Badge variant="teal" className="mt-1.5 text-[10px]">
                      {formatDistanceToNowStrict(nextSession.startsAt, {
                        addSuffix: true,
                      })}
                    </Badge>
                  </div>
                </div>
                {nextSession.youtubeUrl && (
                  <a
                    href={nextSession.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-teal-700"
                  >
                    Watch recording
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">
                No upcoming sessions.
              </p>
            )}
          </div>

          {/* Due soon */}
          {pending.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  Due soon
                </p>
                <Link
                  href="/student/assignments"
                  className="text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
                >
                  See all
                </Link>
              </div>
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {pending.slice(0, 3).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/student/assignments/${a.id}`}
                      className="flex-1 truncate text-sm font-semibold text-brand-navy-900 hover:underline dark:text-foreground"
                    >
                      {a.title}
                    </Link>
                    {a.dueAt && (
                      <Badge
                        variant={isPast(a.dueAt) ? "error" : "warning"}
                        className="shrink-0 text-[10px]"
                      >
                        {isPast(a.dueAt)
                          ? `Due ${format(a.dueAt, "MMM d")}`
                          : `Due in ${formatDistanceToNowStrict(a.dueAt)}`}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </>
      )}
    </StaggerReveal>
  );
}
