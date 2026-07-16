import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole, canEditSeason } from "@/lib/auth/permissions";
import { loadSeasonByCode } from "@/lib/seasons-query";
import { listSeasonRoster, listGroupsForSelect } from "@/lib/groups-query";
import { RosterGrid } from "@/components/groups/roster-grid";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  return { title: `Assign to groups · ${code}` };
}

export default async function RosterPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);
  const { code } = await params;
  const season = await loadSeasonByCode(code);
  if (!canEditSeason(user, season.id)) redirect("/admin/season");

  const [students, groups] = await Promise.all([
    listSeasonRoster(season.id),
    listGroupsForSelect(season.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Assign to groups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {`${students.length} student${students.length === 1 ? "" : "s"} in ${season.title}. Set each student's group and save.`}
        </p>
      </div>
      <RosterGrid
        seasonId={season.id}
        seasonCode={season.code}
        students={students}
        groups={groups}
      />
    </div>
  );
}
