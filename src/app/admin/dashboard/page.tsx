import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, ClipboardList, PenLine, Users } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatCard } from "@/components/students/stat-card";
import { UpcomingEventsCard } from "@/components/events/upcoming-events-card";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER", "ADMIN"]);

  const seasonIds = user.role === "ADMIN" ? user.seasonAdminIds : undefined;
  const season =
    (await db.season.findFirst({
      where: { ...(seasonIds ? { id: { in: seasonIds } } : {}), status: "ACTIVE", deletedAt: null },
      orderBy: { startDate: "desc" },
      select: { id: true, title: true, code: true },
    })) ??
    (await db.season.findFirst({
      where: { ...(seasonIds ? { id: { in: seasonIds } } : {}), deletedAt: null },
      orderBy: { startDate: "desc" },
      select: { id: true, title: true, code: true },
    }));

  const seasonId = season?.id ?? null;
  const now = new Date();

  const [students, nextSession, weeksCompleted, weeksTotal, attendanceRecords, subs, totalAssignments, quizzes] =
    seasonId
      ? await Promise.all([
          db.studentProfile.findMany({
            where: { activeSeasonId: seasonId, deletedAt: null },
            select: { userId: true, user: { select: { id: true, name: true } } },
          }),
          db.session.findFirst({
            where: { seasonId, startsAt: { gte: now } },
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
          db.session.count({ where: { seasonId, startsAt: { lte: now } } }),
          db.session.count({ where: { seasonId } }),
          db.attendance.findMany({
            where: { session: { seasonId } },
            select: { studentUserId: true, status: true },
          }),
          db.submission.findMany({
            where: { assignment: { seasonId, deletedAt: null } },
            select: { studentUserId: true, status: true },
          }),
          db.assignment.count({ where: { seasonId, deletedAt: null } }),
          db.quiz.findMany({
            where: { seasonId },
            select: { id: true, grades: { select: { score: true } } },
          }),
        ])
      : ([[], null, 0, 0, [], [], 0, []] as const);

  const studentIds = students.map((s) => s.userId);

  // Per-student attendance
  const attMap = new Map<number, { present: number; late: number }>();
  for (const r of attendanceRecords) {
    const cur = attMap.get(r.studentUserId) ?? { present: 0, late: 0 };
    if (r.status === "PRESENT") cur.present++;
    if (r.status === "LATE") cur.late++;
    attMap.set(r.studentUserId, cur);
  }

  const completedMap = new Map<number, number>();
  for (const s of subs) {
    if (s.status === "SUBMITTED" || s.status === "REVIEWED" || s.status === "RETURNED") {
      completedMap.set(s.studentUserId, (completedMap.get(s.studentUserId) ?? 0) + 1);
    }
  }

  const studentRows = students.map((s) => {
    const att = attMap.get(s.userId) ?? { present: 0, late: 0 };
    const attendancePct =
      weeksCompleted > 0
        ? Math.round(((att.present + att.late) / weeksCompleted) * 100)
        : null;
    const pending = Math.max(0, totalAssignments - (completedMap.get(s.userId) ?? 0));
    return { id: s.userId, name: s.user.name ?? "Student", attendancePct, pending };
  });

  // Lowest attendance first; null (no sessions yet) goes to end
  studentRows.sort((a, b) => (a.attendancePct ?? 101) - (b.attendancePct ?? 101));

  const avgAttendance =
    studentRows.length > 0
      ? Math.round(
          studentRows.reduce((sum, s) => sum + (s.attendancePct ?? 0), 0) / studentRows.length,
        )
      : null;

  const quizzesPending = quizzes.filter(
    (q) =>
      studentIds.length > 0 &&
      q.grades.filter((g) => g.score !== null).length < studentIds.length,
  ).length;

  const pendingReview = subs.filter((s) => s.status === "SUBMITTED").length;
  const reviewed = subs.filter((s) => s.status === "REVIEWED" || s.status === "RETURNED").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero: season attendance ring */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={avgAttendance ?? 0}
            label={
              avgAttendance !== null
                ? `Season average attendance ${avgAttendance}%`
                : "No attendance yet"
            }
            indicatorClassName={
              avgAttendance !== null && avgAttendance < 70
                ? "stroke-[var(--color-error-500)]"
                : avgAttendance !== null && avgAttendance < 85
                  ? "stroke-[var(--color-warning-500)]"
                  : undefined
            }
          >
            <span className="text-2xl font-black text-brand-navy-900 dark:text-foreground">
              {avgAttendance !== null ? `${avgAttendance}%` : "—"}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              attendance
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700 dark:text-brand-teal-300">
              Current season
            </p>
            <p className="mt-1 truncate text-lg font-black text-brand-navy-900 dark:text-foreground">
              {season?.title ?? "No active season"}
            </p>
            <p className="text-xs text-muted-foreground">
              {studentIds.length} {studentIds.length === 1 ? "student" : "students"}
              {weeksTotal > 0 ? ` · Week ${weeksCompleted} of ${weeksTotal}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming JPC events */}
      <UpcomingEventsCard includeAlumniOnly={true} />

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Students" value={studentIds.length} href="/admin/students" />
        <StatCard
          label="Progress"
          value={`${weeksTotal > 0 ? Math.round((weeksCompleted / weeksTotal) * 100) : 0}%`}
          sublabel={`Week ${weeksCompleted}/${weeksTotal}`}
        />
        <StatCard
          label="Quizzes"
          value={quizzes.length > 0 ? quizzesPending : 0}
          sublabel="pending"
          href="/admin/quizzes"
          variant={quizzes.length > 0 && quizzesPending > 0 ? "teal" : "white"}
        />
      </div>

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
                  href={`/admin/season/${season?.code}/sessions/${nextSession.id}`}
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
                  {formatDistanceToNowStrict(nextSession.startsAt, { addSuffix: true })}
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
          <p className="mt-2 text-sm italic text-muted-foreground">No upcoming sessions.</p>
        )}
      </div>

      {/* All students */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users className="size-4 text-brand-teal-600" />
          <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">All students</p>
          <Link
            href="/admin/students"
            className="ml-auto text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
          >
            View all
          </Link>
        </div>
        {studentRows.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={Users}
              title="No students enrolled"
              description="Students will appear here once enrolled in the active season."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Student
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Attendance
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Assignments
              </p>
            </div>
            <ul className="divide-y divide-border">
              {studentRows.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <p className="flex-1 truncate text-sm font-semibold text-brand-navy-900 dark:text-foreground">
                      {s.name}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.attendancePct !== null && (
                        <span
                          className={`text-xs font-bold ${
                            s.attendancePct < 70
                              ? "text-error-600 dark:text-error-400"
                              : s.attendancePct < 85
                                ? "text-warning-700 dark:text-warning-300"
                                : "text-success-700 dark:text-success-300"
                          }`}
                        >
                          {s.attendancePct}%
                        </span>
                      )}
                      {s.pending > 0 && (
                        <Badge variant="warning" className="text-[10px]">
                          {s.pending} pending
                        </Badge>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Assignments overview */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ClipboardList className="size-4 text-brand-teal-600" />
          <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">Assignments</p>
          <Link
            href="/admin/assignments"
            className="ml-auto text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          {[
            {
              label: "Pending review",
              value: pendingReview,
              accent: pendingReview > 0 ? "text-warning-700 dark:text-warning-300" : "text-brand-navy-900 dark:text-foreground",
            },
            { label: "Reviewed", value: reviewed, accent: "text-success-700 dark:text-success-300" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className={`text-2xl font-black ${accent}`}>{value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quizzes overview */}
      {quizzes.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <PenLine className="size-4 text-brand-teal-600" />
            <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">Quizzes</p>
            <Link
              href="/admin/quizzes"
              className="ml-auto text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            {[
              {
                label: "Pending",
                value: quizzesPending,
                accent: quizzesPending > 0 ? "text-warning-700 dark:text-warning-300" : "text-brand-navy-900 dark:text-foreground",
              },
              {
                label: "Fully graded",
                value: quizzes.length - quizzesPending,
                accent: "text-success-700 dark:text-success-300",
              },
            ].map(({ label, value, accent }) => (
              <div key={label} className="px-4 py-3 text-center">
                <p className={`text-2xl font-black ${accent}`}>{value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* At-risk callout */}
      {studentRows.some((s) => s.attendancePct !== null && s.attendancePct < 70) && (
        <div className="flex items-start gap-3 rounded-2xl bg-error-50 p-4 ring-1 ring-error-200 dark:bg-error-950 dark:ring-error-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error-500" />
          <div>
            <p className="text-xs font-bold text-error-800 dark:text-error-200">Students below 70% attendance</p>
            <p className="mt-0.5 text-xs text-error-600 dark:text-error-300">
              {studentRows
                .filter((s) => s.attendancePct !== null && s.attendancePct < 70)
                .map((s) => s.name)
                .join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
