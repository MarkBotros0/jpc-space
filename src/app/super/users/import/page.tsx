import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { StudentImportForm } from "@/components/users/student-import-form";

export const metadata = { title: "Import students" };

export default async function ImportStudentsPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER"]);

  const seasons = await db.season.findMany({
    where: { deletedAt: null },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, title: true, code: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Import students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bulk-create student accounts from a CSV or Excel file. Each new student is enrolled in the
          chosen season and emailed an invite to set their password.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <StudentImportForm seasons={seasons} />
        </CardContent>
      </Card>
    </div>
  );
}
