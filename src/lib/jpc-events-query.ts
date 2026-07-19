import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import type { JpcVisibility } from "@/generated/prisma/enums";

export interface JpcEventRow {
  id: number;
  title: string;
  date: Date;
  endDate: Date | null;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  visibility: JpcVisibility;
  createdById: number | null;
}

export async function listJpcEvents(opts: {
  includeAlumniOnly: boolean;
}): Promise<JpcEventRow[]> {
  const rows = await db.jpcEvent.findMany({
    where: opts.includeAlumniOnly ? undefined : { visibility: "ALL" },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      endDate: true,
      description: true,
      imagePath: true,
      url: true,
      visibility: true,
      createdById: true,
    },
  });

  const storage = getStorage();
  return Promise.all(
    rows.map(async ({ imagePath, ...r }) => ({
      ...r,
      imageUrl: imagePath ? await storage.url(imagePath) : null,
    })),
  );
}
