"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { canManageSessionVideo, canAccessSeason } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/auth/errors";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const questionSchema = z
  .object({
    atSeconds: z.number().int().min(0).max(86_400),
    prompt: z.string().trim().min(2).max(500),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    points: z.number().int().min(1).max(100).default(1),
  })
  .refine((d) => d.correctIndex < d.options.length, {
    message: "Correct answer must be one of the options.",
    path: ["correctIndex"],
  });

export interface VideoQuestionInput {
  atSeconds: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export async function createVideoQuestionAction(
  sessionId: number,
  input: VideoQuestionInput,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();
  if (!(await canManageSessionVideo(user, sessionId))) throw new ForbiddenError();

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return zodErrors(parsed.error);

  await db.sessionVideoQuestion.create({
    data: {
      sessionId,
      atSeconds: parsed.data.atSeconds,
      prompt: parsed.data.prompt,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
      points: parsed.data.points,
      createdById: user.userId,
    },
  });

  revalidatePath(`/student/sessions/${sessionId}`);
  return { ok: true };
}

export async function updateVideoQuestionAction(
  questionId: number,
  input: VideoQuestionInput,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();
  const question = await db.sessionVideoQuestion.findUnique({
    where: { id: questionId },
    select: { sessionId: true },
  });
  if (!question) return { ok: false, error: "Question not found." };
  if (!(await canManageSessionVideo(user, question.sessionId))) throw new ForbiddenError();

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return zodErrors(parsed.error);

  await db.sessionVideoQuestion.update({
    where: { id: questionId },
    data: {
      atSeconds: parsed.data.atSeconds,
      prompt: parsed.data.prompt,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
      points: parsed.data.points,
    },
  });

  revalidatePath(`/student/sessions/${question.sessionId}`);
  return { ok: true };
}

export async function deleteVideoQuestionAction(
  questionId: number,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();
  const question = await db.sessionVideoQuestion.findUnique({
    where: { id: questionId },
    select: { sessionId: true },
  });
  if (!question) return { ok: false, error: "Question not found." };
  if (!(await canManageSessionVideo(user, question.sessionId))) throw new ForbiddenError();

  await db.sessionVideoQuestion.delete({ where: { id: questionId } });

  revalidatePath(`/student/sessions/${question.sessionId}`);
  return { ok: true };
}

export type SubmitAnswerResult =
  | { ok: true; isCorrect: boolean; correctIndex: number }
  | { ok: false; error: string };

// One answer per question, no retries: if a response already exists we return
// its recorded result rather than re-grading.
export async function submitVideoAnswerAction(
  questionId: number,
  selectedIndex: number,
): Promise<SubmitAnswerResult> {
  const user = await getCurrentUserOrRedirect();

  const question = await db.sessionVideoQuestion.findUnique({
    where: { id: questionId },
    select: {
      sessionId: true,
      atSeconds: true,
      correctIndex: true,
      options: true,
      session: { select: { seasonId: true } },
    },
  });
  if (!question) return { ok: false, error: "Question not found." };
  if (user.role !== "STUDENT") throw new ForbiddenError();
  if (!(await canAccessSeason(user, question.session.seasonId))) throw new ForbiddenError();

  if (selectedIndex < 0 || selectedIndex >= question.options.length) {
    return { ok: false, error: "Invalid answer." };
  }

  const existing = await db.sessionVideoQuestionResponse.findUnique({
    where: { questionId_studentUserId: { questionId, studentUserId: user.userId } },
    select: { isCorrect: true },
  });
  if (existing) {
    return { ok: true, isCorrect: existing.isCorrect, correctIndex: question.correctIndex };
  }

  const isCorrect = selectedIndex === question.correctIndex;

  await db.$transaction([
    db.sessionVideoQuestionResponse.create({
      data: { questionId, studentUserId: user.userId, selectedIndex, isCorrect },
    }),
    db.sessionVideoProgress.upsert({
      where: {
        sessionId_studentUserId: {
          sessionId: question.sessionId,
          studentUserId: user.userId,
        },
      },
      create: {
        sessionId: question.sessionId,
        studentUserId: user.userId,
        furthestSeconds: question.atSeconds,
      },
      update: { furthestSeconds: { set: question.atSeconds } },
    }),
  ]);

  return { ok: true, isCorrect, correctIndex: question.correctIndex };
}

const progressSchema = z.object({
  furthestSeconds: z.number().int().min(0).max(86_400),
  completed: z.boolean().default(false),
});

// Persist how far the student has watched (for resume) and mark completion.
// furthestSeconds only ever moves forward.
export async function saveVideoProgressAction(
  sessionId: number,
  furthestSeconds: number,
  completed = false,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();
  if (user.role !== "STUDENT") throw new ForbiddenError();

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { seasonId: true },
  });
  if (!session) return { ok: false, error: "Session not found." };
  if (!(await canAccessSeason(user, session.seasonId))) throw new ForbiddenError();

  const parsed = progressSchema.safeParse({ furthestSeconds, completed });
  if (!parsed.success) return { ok: false, error: "Invalid progress." };

  const current = await db.sessionVideoProgress.findUnique({
    where: { sessionId_studentUserId: { sessionId, studentUserId: user.userId } },
    select: { furthestSeconds: true, completedAt: true },
  });
  const nextFurthest = Math.max(current?.furthestSeconds ?? 0, parsed.data.furthestSeconds);
  const completedAt =
    current?.completedAt ?? (parsed.data.completed ? new Date() : null);

  await db.sessionVideoProgress.upsert({
    where: { sessionId_studentUserId: { sessionId, studentUserId: user.userId } },
    create: {
      sessionId,
      studentUserId: user.userId,
      furthestSeconds: nextFurthest,
      completedAt,
    },
    update: { furthestSeconds: nextFurthest, completedAt },
  });

  return { ok: true };
}

function zodErrors(
  err: z.ZodError,
): { ok: false; error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}
