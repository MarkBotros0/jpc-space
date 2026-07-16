import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole, canEditSeason } from "@/lib/auth/permissions";
import { loadSeasonByCode } from "@/lib/seasons-query";
import { Card, CardContent } from "@/components/ui/card";
import { GroupImportForm } from "@/components/groups/group-import-form";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  return { title: `Import group assignments · ${code}` };
}

export default async function GroupImportPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);
  const { code } = await params;
  const season = await loadSeasonByCode(code);
  if (!canEditSeason(user, season.id)) redirect("/admin/season");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Import group assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV or Excel with <code>email</code> and <code>group</code> columns. Students in
          this season are matched by email and moved into the named group.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <GroupImportForm seasonId={season.id} />
        </CardContent>
      </Card>
    </div>
  );
}
