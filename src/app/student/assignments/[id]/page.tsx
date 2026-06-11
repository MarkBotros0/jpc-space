import Link from "next/link";
import { redirect } from "next/navigation";
import { format, isPast, formatDistanceToNowStrict } from "date-fns";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { ensureDraftSubmission } from "@/lib/assignment-actions";
import { loadAssignmentById } from "@/lib/assignments-query";
import { Badge } from "@/components/ui/badge";
import { RichTextView } from "@/components/ui/rich-text-view";
import { StudentSubmissionForm } from "@/components/assignments/student-submission-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Assignment" };

export default async function StudentAssignmentPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);
  const { id } = await params;
  const assignment = await loadAssignmentById(Number(id));

  // Verify the student is targeted by this assignment.
  if (user.activeSeasonId !== assignment.seasonId) redirect("/student/assignments");
  if (!assignment.isAllGroups) {
    const membership = await db.groupStudent.findUnique({
      where: { studentUserId: user.userId },
      select: { groupId: true },
    });
    if (!membership || !assignment.groupIds.includes(membership.groupId)) {
      redirect("/student/assignments");
    }
  }

  const stub = await ensureDraftSubmission(assignment.id, user.userId);
  const submission = await db.submission.findUnique({
    where: { id: stub.id },
    select: {
      id: true,
      status: true,
      text: true,
      feedback: true,
      files: {
        select: { id: true, originalName: true, sizeBytes: true },
        orderBy: { uploadedAt: "asc" },
      },
    },
  });
  if (!submission) redirect("/student/assignments");

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div>
        <Link
          href="/student/assignments"
          className="text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
        >
          ← Assignments
        </Link>
        {/* Navy hero card */}
        <div className="mt-2 rounded-2xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 p-4 shadow-[0_4px_20px_rgba(31,50,96,0.25)] dark:from-brand-navy-800 dark:to-brand-navy-600 dark:ring-1 dark:ring-white/10">
          <h1 className="text-xl font-black text-white">
            {assignment.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {assignment.dueAt && (
              <Badge
                variant={isPast(assignment.dueAt) ? "error" : "warning"}
              >
                {isPast(assignment.dueAt)
                  ? `Due ${format(assignment.dueAt, "MMM d, yyyy")}`
                  : `Due in ${formatDistanceToNowStrict(assignment.dueAt)}`}
              </Badge>
            )}
            {!assignment.dueAt && (
              <Badge className="border-white/20 bg-white/10 text-white">No due date</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {assignment.description && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Brief
          </p>
          <RichTextView html={assignment.description} />
        </div>
      )}

      {/* Submission form — unchanged component */}
      <StudentSubmissionForm
        submissionId={submission.id}
        status={submission.status}
        initialText={submission.text ?? ""}
        initialFiles={submission.files}
        feedback={submission.feedback}
        dueAt={assignment.dueAt}
        acceptsFiles={assignment.maxFileSizeMb != null}
        maxFileSizeMb={assignment.maxFileSizeMb}
        allowedMimeCategories={assignment.allowedMimeCategories}
      />
    </div>
  );
}
