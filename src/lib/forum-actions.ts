"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { canCommentOnForumSubmission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/auth/errors";
import { countWords } from "@/lib/forum";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Submit a forum response. Enforces the assignment's `forumMinWords` gate and
 * marks the owning submission SUBMITTED (which unlocks the peer feed).
 */
export async function submitForumPostAction(
  submissionId: number,
  text: string,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      studentUserId: true,
      assignmentId: true,
      assignment: { select: { type: true, forumMinWords: true, dueAt: true } },
    },
  });
  if (!sub) return { ok: false, error: "Response not found." };
  if (sub.studentUserId !== user.userId) throw new ForbiddenError();
  if (sub.assignment.type !== "FORUM") return { ok: false, error: "Not a forum assignment." };

  const words = countWords(text);
  const min = sub.assignment.forumMinWords ?? 0;
  if (words < min) {
    return { ok: false, error: `Please write at least ${min} words (you have ${words}).` };
  }

  await db.submission.update({
    where: { id: submissionId },
    data: { text, status: "SUBMITTED", submittedAt: new Date() },
  });

  revalidatePath(`/student/assignments/${sub.assignmentId}`);
  revalidatePath("/student/assignments");
  revalidatePath("/leader/submissions");
  revalidatePath("/admin/assignments");
  return { ok: true };
}

const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty.").max(5000),
});

export async function addForumCommentAction(
  submissionId: number,
  body: string,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();

  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  if (!(await canCommentOnForumSubmission(user, submissionId))) throw new ForbiddenError();

  const target = await db.submission.findUnique({
    where: { id: submissionId },
    select: { assignmentId: true },
  });
  if (!target) return { ok: false, error: "Response not found." };

  // Students must have posted their own response first (post-first-to-unlock).
  if (user.role === "STUDENT") {
    const own = await db.submission.findUnique({
      where: {
        assignmentId_studentUserId: {
          assignmentId: target.assignmentId,
          studentUserId: user.userId,
        },
      },
      select: { status: true },
    });
    if (!own || own.status === "DRAFT") {
      return { ok: false, error: "Post your own response before commenting." };
    }
  }

  await db.forumComment.create({
    data: { submissionId, authorUserId: user.userId, body: parsed.data.body },
  });

  revalidatePath(`/student/assignments/${target.assignmentId}`);
  return { ok: true };
}

export async function deleteForumCommentAction(commentId: number): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();

  const comment = await db.forumComment.findUnique({
    where: { id: commentId },
    select: {
      authorUserId: true,
      submission: {
        select: { assignmentId: true, assignment: { select: { seasonId: true } } },
      },
    },
  });
  if (!comment) return { ok: false, error: "Comment not found." };

  const isAuthor = comment.authorUserId === user.userId;
  const isAdmin =
    user.role === "SUPER" || user.seasonAdminIds.includes(comment.submission.assignment.seasonId);
  if (!isAuthor && !isAdmin) throw new ForbiddenError();

  await db.forumComment.delete({ where: { id: commentId } });
  revalidatePath(`/student/assignments/${comment.submission.assignmentId}`);
  return { ok: true };
}
