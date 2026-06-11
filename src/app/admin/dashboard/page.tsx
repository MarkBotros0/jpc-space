import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { computeAtRiskStudents } from "@/lib/engagement";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER", "ADMIN"]);

  // For ADMIN: use their first active admin season.
  // For SUPER: use the first active season in the system.
  let seasonId: number | null = null;
  let seasonTitle: string | null = null;

  if (user.seasonAdminIds.length > 0) {
    const season = await db.season.findFirst({
      where: {
        id: { in: user.seasonAdminIds },
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true, title: true },
      orderBy: { startDate: "desc" },
    });
    seasonId = season?.id ?? null;
    seasonTitle = season?.title ?? null;
  } else if (user.role === "SUPER") {
    const season = await db.season.findFirst({
      where: { status: "ACTIVE", deletedAt: null },
      select: { id: true, title: true },
      orderBy: { startDate: "desc" },
    });
    seasonId = season?.id ?? null;
    seasonTitle = season?.title ?? null;
  }

  const atRisk = seasonId ? await computeAtRiskStudents(seasonId) : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {seasonTitle ? `Season: ${seasonTitle}` : "No active season"}
        </p>
      </div>

      {/* At-risk students */}
      <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
          <AlertTriangle className="size-4 text-error-500" />
          <p className="text-sm font-bold text-brand-navy-900">Students at risk</p>
          {atRisk.length > 0 && (
            <span className="ml-auto rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-700">
              {atRisk.length}
            </span>
          )}
        </div>

        {!seasonId ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={AlertTriangle}
              title="No active season"
              description="Assign yourself as admin to an active season to see attendance data."
            />
          </div>
        ) : atRisk.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={AlertTriangle}
              title="No students at risk"
              description="All students are within their absence budget."
            />
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {atRisk.map((s) => (
              <li key={s.userId}>
                <Link
                  href={`/admin/students/${s.userId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-navy-900">
                      {s.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {s.absentCount} absent · {s.lateCount} late · {s.minutesUsed} min used
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-error-600">
                      +{s.minutesOver} min
                    </p>
                    <p className="text-[10px] text-neutral-400">over budget</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
