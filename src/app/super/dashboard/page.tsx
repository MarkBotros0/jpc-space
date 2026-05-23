import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { DashboardShell } from "@/app/(dashboards)/dashboard-shell";

export default async function SuperDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER"]);
  return <DashboardShell user={user} title="Super dashboard" />;
}
