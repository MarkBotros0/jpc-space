import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { DashboardShell } from "@/app/(dashboards)/dashboard-shell";

export default async function MentorDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER", "MENTOR"]);
  return <DashboardShell user={user} title="Mentor dashboard" />;
}
