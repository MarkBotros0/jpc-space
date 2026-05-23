import { db } from "@/lib/db";

export interface Scopes {
  seasonAdminIds: number[];
  groupLeaderIds: number[];
  activeSeasonId: number | null;
}

export async function loadScopes(userId: number): Promise<Scopes> {
  const [adminRows, leaderRows, profile] = await Promise.all([
    db.seasonAdmin.findMany({ where: { userId }, select: { seasonId: true } }),
    db.groupLeader.findMany({ where: { userId }, select: { groupId: true } }),
    db.studentProfile.findUnique({
      where: { userId },
      select: { activeSeasonId: true },
    }),
  ]);
  return {
    seasonAdminIds: adminRows.map((r) => r.seasonId),
    groupLeaderIds: leaderRows.map((r) => r.groupId),
    activeSeasonId: profile?.activeSeasonId ?? null,
  };
}
