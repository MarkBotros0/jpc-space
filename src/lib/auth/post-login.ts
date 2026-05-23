import type { UserRole } from "@/generated/prisma/enums";

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "SUPER":
      return "/super/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "LEADER":
      return "/leader/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    case "MENTOR":
      return "/mentor/dashboard";
  }
}

export function rolePrefixAllowed(role: UserRole, pathname: string): boolean {
  if (role === "SUPER") return true;
  if (pathname.startsWith("/super")) return false;
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/leader")) return role === "LEADER";
  if (pathname.startsWith("/student")) return role === "STUDENT";
  if (pathname.startsWith("/mentor")) return role === "MENTOR";
  return true;
}
