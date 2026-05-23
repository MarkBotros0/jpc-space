import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { DashboardShell } from "@/app/(dashboards)/dashboard-shell";

export default async function AdminDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER", "ADMIN"]);
  return <DashboardShell user={user} title="Admin dashboard" />;
}
