import { format, startOfDay } from "date-fns";
import { CalendarDays } from "lucide-react";

import { listJpcEvents, viewerSeasonIds } from "@/lib/jpc-events-query";
import type { SessionUser } from "@/lib/rbac";

function fmtOne(d: Date): string {
  const timed = d.getHours() !== 0 || d.getMinutes() !== 0;
  return format(d, timed ? "MMM d · h:mm a" : "MMM d");
}

function whenLabel(start: Date, end: Date | null): string {
  if (!end) return fmtOne(start);
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay ? fmtOne(start) : `${fmtOne(start)} – ${fmtOne(end)}`;
}

/** Upcoming JPC events for a dashboard, scoped to what this user may see. */
export async function UpcomingEventsCard({ user }: { user: SessionUser }) {
  const today = startOfDay(new Date());
  const events = (
    await listJpcEvents({
      includeAlumniOnly: user.role !== "STUDENT",
      seasonIds: await viewerSeasonIds(user),
    })
  )
    .filter((e) => (e.endDate ?? e.date) >= today)
    .slice(0, 4);

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Upcoming events
      </p>
      <ul className="mt-2 flex flex-col gap-2.5">
        {events.map((e) => {
          const inner = (
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-teal-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-brand-navy-900 dark:text-foreground">
                  {e.title}
                </p>
                <p className="text-xs text-muted-foreground">{whenLabel(e.date, e.endDate)}</p>
              </div>
            </div>
          );
          return (
            <li key={e.id}>
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
