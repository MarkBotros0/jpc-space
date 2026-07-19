import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import type { JpcVisibility } from "@/generated/prisma/enums";
import type { SessionUser } from "@/lib/rbac";

export interface JpcEventRow {
  id: number;
  title: string;
  date: Date;
  endDate: Date | null;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  visibility: JpcVisibility;
  seasonId: number | null;
  seasonTitle: string | null;
  createdById: number | null;
}

/**
 * The seasons a viewer can see SEASON-scoped events for: their active season (student),
 * the seasons they admin, and the seasons of the groups they lead. SUPER sees all.
 */
export async function viewerSeasonIds(user: SessionUser): Promise<number[] | "all"> {
  if (user.role === "SUPER") return "all";
  const ids = new Set<number>();
  if (user.activeSeasonId) ids.add(user.activeSeasonId);
  for (const s of user.seasonAdminIds) ids.add(s);
  if (user.groupLeaderIds.length > 0) {
    const groups = await db.group.findMany({
      where: { id: { in: user.groupLeaderIds } },
      select: { seasonId: true },
    });
    for (const g of groups) ids.add(g.seasonId);
  }
  return [...ids];
}

export async function listJpcEvents(opts: {
  includeAlumniOnly: boolean;
  seasonIds?: number[] | "all";
}): Promise<JpcEventRow[]> {
  const rows = await db.jpcEvent.findMany({
    where: {
      OR: [
        { visibility: "ALL" as const },
        ...(opts.includeAlumniOnly ? [{ visibility: "ALUMNI_ONLY" as const }] : []),
        ...(opts.seasonIds === "all"
          ? [{ visibility: "SEASON" as const }]
          : opts.seasonIds && opts.seasonIds.length > 0
            ? [{ visibility: "SEASON" as const, seasonId: { in: opts.seasonIds } }]
            : []),
      ],
    },
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
      seasonId: true,
      season: { select: { title: true } },
      createdById: true,
    },
  });

  const storage = getStorage();
  return Promise.all(
    rows.map(async ({ imagePath, season, ...r }) => ({
      ...r,
      seasonTitle: season?.title ?? null,
      imageUrl: imagePath ? await storage.url(imagePath) : null,
    })),
  );
}
