import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { DashboardShell } from "@/app/(dashboards)/dashboard-shell";

export default async function LeaderDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER", "LEADER"]);
  return <DashboardShell user={user} title="Leader dashboard" />;
}
