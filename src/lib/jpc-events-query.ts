import { db } from "@/lib/db";
import type { JpcVisibility } from "@/generated/prisma/enums";

export interface JpcEventRow {
  id: number;
  title: string;
  date: Date;
  url: string | null;
  visibility: JpcVisibility;
  createdById: number | null;
}

export async function listJpcEvents(opts: {
  includeAlumniOnly: boolean;
}): Promise<JpcEventRow[]> {
  return db.jpcEvent.findMany({
    where: opts.includeAlumniOnly ? undefined : { visibility: "ALL" },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      url: true,
      visibility: true,
      createdById: true,
    },
  });
}
