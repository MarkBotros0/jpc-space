import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { dashboardPathForRole } from "@/lib/auth/post-login";
import type { UserRole } from "@/generated/prisma/enums";

interface RoleLayoutProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export async function RoleLayout({ allowedRoles, children }: RoleLayoutProps) {
  const user = await getCurrentUserOrRedirect();
  if (!allowedRoles.includes(user.role)) {
    redirect(dashboardPathForRole(user.role));
  }
  return <AppShell user={user}>{children}</AppShell>;
}
