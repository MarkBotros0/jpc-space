import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Current season" };

function initialsOf(name: string | null, fallback = "?"): string {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || fallback;
}

export default async function StudentSeasonPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  if (!user.activeSeasonId) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">
          Current season
        </h1>
        <EmptyState
          icon={Users}
          title="No active season"
          description="An admin will enroll you when you're ready."
        />
      </div>
    );
  }

  const season = await db.season.findUnique({
    where: { id: user.activeSeasonId },
    select: {
      id: true,
      title: true,
      code: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!season) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Current season</h1>
        <p className="text-sm text-muted-foreground">Season not found.</p>
      </div>
    );
  }

  const [membership, upcomingSessions, weeksTotal, weeksCompleted] = await Promise.all([
    db.groupStudent.findUnique({
      where: { studentUserId: user.userId },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            leaders: {
              select: { user: { select: { name: true, email: true } } },
            },
            students: {
              select: { studentUser: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    db.session.findMany({
      where: { seasonId: season.id, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: { id: true, title: true, startsAt: true, location: true },
    }),
    db.session.count({ where: { seasonId: season.id } }),
    db.session.count({ where: { seasonId: season.id, startsAt: { lte: new Date() } } }),
  ]);

  const group = membership?.group ?? null;
  const progressPct = weeksTotal > 0 ? Math.round((weeksCompleted / weeksTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Identity hero */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700 dark:text-brand-teal-300">
              Current season
            </p>
            <h1 className="mt-1 text-2xl font-black text-brand-navy-900 dark:text-foreground">
              {season.title}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />
              {format(season.startDate, "MMM d, yyyy")} – {format(season.endDate, "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Badge variant="teal">{season.status}</Badge>
            {group && <Badge variant="outline">{group.name}</Badge>}
          </div>
        </div>

        {weeksTotal > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-brand-navy-900 dark:text-foreground">
                Week {weeksCompleted} of {weeksTotal}
              </span>
              <span className="text-muted-foreground">
                {progressPct >= 100
                  ? "Complete"
                  : `${weeksTotal - weeksCompleted} to go`}
              </span>
            </div>
            <Progress value={progressPct} className="mt-1.5" />
          </div>
        )}
      </div>

      {/* Upcoming sessions */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Upcoming sessions
          </p>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/student/calendar" />}
            className="text-xs text-brand-teal-700 dark:text-brand-teal-300"
          >
            See calendar
          </Button>
        </div>
        {upcomingSessions.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">No upcoming sessions.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcomingSessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-teal-100 text-brand-teal-800 dark:bg-brand-teal-950 dark:text-brand-teal-200">
                  <span className="text-[9px] font-bold uppercase leading-none">
                    {format(s.startsAt, "MMM")}
                  </span>
                  <span className="text-base font-black leading-tight">
                    {format(s.startsAt, "d")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/student/sessions/${s.id}`}
                    className="truncate text-sm font-semibold text-brand-navy-900 hover:underline dark:text-foreground"
                  >
                    {s.title}
                  </Link>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{format(s.startsAt, "EEE · h:mm a")}</span>
                    {s.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 shrink-0" />
                        {s.location}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Your group */}
      {group && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-navy-100 text-brand-navy-800 dark:bg-brand-navy-900 dark:text-brand-navy-100">
              <Users className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Your group
              </p>
              <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">
                {group.name}
              </p>
            </div>
          </div>

          {group.description && (
            <p className="mb-4 text-sm text-muted-foreground">{group.description}</p>
          )}

          {/* Leaders */}
          <p className="mb-2 text-xs font-bold text-brand-navy-900 dark:text-foreground">
            {group.leaders.length === 1 ? "Leader" : "Leaders"}
          </p>
          {group.leaders.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">No leaders assigned yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {group.leaders.map((l, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy-100 text-xs font-bold text-brand-navy-800 dark:bg-brand-navy-900 dark:text-brand-navy-100">
                    {initialsOf(l.user.name, l.user.email[0]?.toUpperCase() ?? "?")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-navy-900 dark:text-foreground">
                      {l.user.name ?? l.user.email}
                    </p>
                    {l.user.name && (
                      <a
                        href={`mailto:${l.user.email}`}
                        className="truncate text-xs text-muted-foreground hover:text-brand-teal-700 hover:underline dark:hover:text-brand-teal-300"
                      >
                        {l.user.email}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Members */}
          <p className="mb-2 mt-4 text-xs font-bold text-brand-navy-900 dark:text-foreground">
            Members
            <span className="ml-1 font-normal text-muted-foreground">
              ({group.students.length})
            </span>
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {group.students.map((s) => {
              const isYou = s.studentUser.id === user.userId;
              return (
                <li
                  key={s.studentUser.id}
                  className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs ${
                    isYou
                      ? "bg-brand-teal-100 text-brand-teal-800 ring-1 ring-brand-teal-300 dark:bg-brand-teal-950 dark:text-brand-teal-200 dark:ring-brand-teal-900"
                      : "bg-muted/60 text-foreground"
                  }`}
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-card text-[10px] font-bold text-brand-navy-800 dark:text-brand-navy-100">
                    {initialsOf(s.studentUser.name)}
                  </span>
                  <span className="max-w-32 truncate font-medium">
                    {isYou ? "You" : (s.studentUser.name ?? "—")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* About this season */}
      {season.description && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:p-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            About this season
          </p>
          <p className="text-sm text-foreground/90">{season.description}</p>
        </div>
      )}
    </div>
  );
}
