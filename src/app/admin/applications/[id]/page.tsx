import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/applications/review-actions";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Application Detail" };

function statusBadgeVariant(
  status: ApplicationStatus,
): "warning" | "success" | "error" | "default" {
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";
  return "default";
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 md:grid-cols-[200px_1fr]">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);

  const { id } = await params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) notFound();

  const application = await db.application.findUnique({
    where: { id: appId },
    include: { reviewedBy: { select: { name: true } } },
  });

  if (!application) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Applications
        </Link>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{application.fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{application.email}</p>
          </div>
          <Badge variant={statusBadgeVariant(application.status)} className="text-sm px-3 py-1">
            {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Submitted {format(new Date(application.createdAt), "dd MMMM yyyy 'at' HH:mm")}
        </p>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:p-7">
        <h2 className="mb-5 text-base font-semibold text-foreground">Personal Details</h2>
        <dl className="space-y-4">
          <DetailRow label="Phone" value={application.phone} />
          <DetailRow
            label="Date of Birth"
            value={application.dateOfBirth
              ? format(new Date(application.dateOfBirth), "dd MMMM yyyy")
              : null}
          />
          <DetailRow label="University" value={application.university} />
          <DetailRow label="Year of Study" value={application.yearOfStudy} />
          <DetailRow label="How they heard" value={application.howHeard} />
        </dl>
      </div>

      {/* Written responses */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:p-7">
        <h2 className="mb-5 text-base font-semibold text-foreground">Written Responses</h2>
        <div className="space-y-6">
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">
              Spiritual Background
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {application.spiritualBackground}
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">
              Why they want to join
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {application.whyJoin}
            </p>
          </div>
        </div>
      </div>

      {/* Review section */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:p-7">
        <h2 className="mb-5 text-base font-semibold text-foreground">Review</h2>

        {application.status === "PENDING" ? (
          <ReviewActions applicationId={application.id} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reviewed by{" "}
              <span className="font-medium text-foreground">
                {application.reviewedBy?.name ?? "Unknown"}
              </span>{" "}
              on{" "}
              {application.reviewedAt
                ? format(new Date(application.reviewedAt), "dd MMM yyyy")
                : "—"}
            </p>
            {application.rejectionNote && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 dark:border-error-800/60 dark:bg-error-950/60">
                <p className="text-xs font-medium text-error-700 dark:text-error-300">
                  Rejection note
                </p>
                <p className="mt-1 text-sm text-error-900 dark:text-error-100">
                  {application.rejectionNote}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
