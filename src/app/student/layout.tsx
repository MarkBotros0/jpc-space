import type { ReactNode } from "react";

import { RoleLayout } from "@/components/layout/role-layout";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout allowedRoles={["STUDENT"]}>{children}</RoleLayout>
  );
}
