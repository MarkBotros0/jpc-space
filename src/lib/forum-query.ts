import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import type { SubmissionStatus } from "@/generated/prisma/enums";

export interface ForumCommentView {
  id: number;
  authorUserId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: Date;
}

export interface ForumPostView {
  submissionId: number;
  studentUserId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  submittedAt: Date | null;
  comments: ForumCommentView[];
}

export interface ForumViewData {
  ownSubmissionId: number;
  ownText: string;
  ownStatus: SubmissionStatus;
  /** True until the student submits their own response — the peer feed stays hidden. */
  locked: boolean;
  minWords: number | null;
  allowComments: boolean;
  /** Peer responses from the student's own group. Empty while locked or ungrouped. */
  posts: ForumPostView[];
}

function displayName(name: string | null, email: string): string {
  return name && name.trim() ? name : email;
}

/**
 * Load the forum view for a student: their own response plus — once they've
 * submitted — their group-mates' responses (with comments when enabled).
 */
export async function loadForumView(
  assignmentId: number,
  studentUserId: number,
  ownSubmissionId: number,
): Promise<ForumViewData> {
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { forumMinWords: true, forumAllowComments: true },
  });

  const own = await db.submission.findUnique({
    where: { id: ownSubmissionId },
    select: { text: true, status: true },
  });

  const ownStatus = own?.status ?? "DRAFT";
  const locked = ownStatus === "DRAFT";

  const base: ForumViewData = {
    ownSubmissionId,
    ownText: own?.text ?? "",
    ownStatus,
    locked,
    minWords: assignment?.forumMinWords ?? null,
    allowComments: assignment?.forumAllowComments ?? false,
    posts: [],
  };

  if (locked) return base;

  const membership = await db.groupStudent.findUnique({
    where: { studentUserId },
    select: { groupId: true },
  });
  if (!membership) return base; // ungrouped student: nothing to show in the group feed

  const peers = await db.groupStudent.findMany({
    where: { groupId: membership.groupId, studentUserId: { not: studentUserId } },
    select: { studentUserId: true },
  });
  const peerIds = peers.map((p) => p.studentUserId);
  if (peerIds.length === 0) return base;

  const submissions = await db.submission.findMany({
    where: {
      assignmentId,
      studentUserId: { in: peerIds },
      status: { not: "DRAFT" },
      NOT: { text: null },
    },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      studentUserId: true,
      text: true,
      submittedAt: true,
      studentUser: { select: { name: true, email: true, avatarPath: true } },
      forumComments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          authorUserId: true,
          body: true,
          createdAt: true,
          authorUser: { select: { name: true, email: true, avatarPath: true } },
        },
      },
    },
  });

  const storage = getStorage();
  const posts: ForumPostView[] = await Promise.all(
    submissions.map(async (s) => ({
      submissionId: s.id,
      studentUserId: s.studentUserId,
      authorName: displayName(s.studentUser.name, s.studentUser.email),
      authorAvatarUrl: s.studentUser.avatarPath
        ? await storage.url(s.studentUser.avatarPath)
        : null,
      text: s.text ?? "",
      submittedAt: s.submittedAt,
      comments: await Promise.all(
        s.forumComments.map(async (c) => ({
          id: c.id,
          authorUserId: c.authorUserId,
          authorName: displayName(c.authorUser.name, c.authorUser.email),
          authorAvatarUrl: c.authorUser.avatarPath
            ? await storage.url(c.authorUser.avatarPath)
            : null,
          body: c.body,
          createdAt: c.createdAt,
        })),
      ),
    })),
  );

  return { ...base, posts };
}
