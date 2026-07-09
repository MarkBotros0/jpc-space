import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { listApplications } from "@/lib/applications";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Applications" };

const STATUS_TABS: { label: string; value: ApplicationStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

function statusBadgeVariant(
  status: ApplicationStatus,
): "warning" | "success" | "error" | "default" {
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";
  return "default";
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);

  const { status: statusParam } = await searchParams;
  const activeTab = STATUS_TABS.find((t) => t.value === statusParam?.toUpperCase())?.value ?? "ALL";

  const applications = await listApplications({
    status: activeTab === "ALL" ? undefined : activeTab,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Applications" description="Review student applications to join JPC." />

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "ALL" ? "/admin/applications" : `/admin/applications?status=${tab.value}`}
            className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors md:flex-none md:px-5 ${
              activeTab === tab.value
                ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="When someone applies through the public site, their application will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <ul className="divide-y divide-border">
            {applications.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/admin/applications/${app.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 md:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{app.fullName}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{app.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant={statusBadgeVariant(app.status)}>
                      {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(app.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
