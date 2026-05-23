import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { DashboardShell } from "@/app/(dashboards)/dashboard-shell";

export default async function StudentDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER", "STUDENT"]);
  return <DashboardShell user={user} title="Student dashboard" />;
}
