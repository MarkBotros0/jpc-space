import type { Metadata } from "next";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { listJpcEvents } from "@/lib/jpc-events-query";
import { JpcEventManagerClient } from "./jpc-event-manager-client";

export const metadata: Metadata = { title: "JPC Events" };

export default async function SuperEventsPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER"]);

  const [events, seasons] = await Promise.all([
    listJpcEvents({ includeAlumniOnly: true, seasonIds: "all" }),
    db.season.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">JPC Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organisation-wide events visible on all members&apos; calendars.</p>
      </div>
      <JpcEventManagerClient events={events} seasons={seasons} />
    </div>
  );
}
