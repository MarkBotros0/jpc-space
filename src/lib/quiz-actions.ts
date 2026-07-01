"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import {
  requireRole,
  canEditSeason,
  canManageQuiz,
  canGradeQuiz,
  canAccessSeason,
} from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/auth/errors";
import { isLeaderInSeason } from "@/lib/rbac";
import { createNotification } from "@/lib/notifications";
import type { QuizKind, QuizQuestionType } from "@/generated/prisma/enums";

const createQuizSchema = z.object({
  sessionId: z.number().int().positive(),
  seasonId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  kind: z.enum(["PAPER", "ONLINE"]),
  // Only meaningful for PAPER; ONLINE derives maxScore from its questions.
  maxScore: z.number().int().min(1).max(1000).optional(),
});

export async function createQuizAction(input: {
  sessionId: number;
  seasonId: number;
  title: string;
  kind: QuizKind;
  maxScore?: number;
}): Promise<{ error?: string; quizId?: number }> {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);
  if (!canEditSeason(user, input.seasonId)) return { error: "Unauthorized" };

  const parsed = createQuizSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.kind === "PAPER" && !parsed.data.maxScore) {
    return { error: "Max score is required for paper quizzes." };
  }

  const season = await db.season.findUnique({
    where: { id: parsed.data.seasonId },
    select: { code: true },
  });

  const quiz = await db.quiz.create({
    data: {
      sessionId: parsed.data.sessionId,
      seasonId: parsed.data.seasonId,
      title: parsed.data.title,
      kind: parsed.data.kind,
      maxScore: parsed.data.kind === "PAPER" ? parsed.data.maxScore! : 0,
      createdById: user.userId,
    },
    select: { id: true },
  });

  if (season) {
    revalidatePath(`/admin/season/${season.code}/sessions/${parsed.data.sessionId}`);
    revalidatePath(`/admin/season/${season.code}`);
  }
  revalidatePath(`/admin/quizzes`);
  revalidatePath(`/leader/sessions/${parsed.data.sessionId}`);
  revalidatePath(`/leader/quizzes`);
  return { quizId: quiz.id };
}

// Recompute an ONLINE quiz's maxScore as the sum of its question points.
async function recomputeQuizMaxScore(quizId: number): Promise<void> {
  const agg = await db.quizQuestion.aggregate({
    where: { quizId },
    _sum: { points: true },
  });
  await db.quiz.update({
    where: { id: quizId },
    data: { maxScore: agg._sum.points ?? 0 },
  });
}

export async function deleteQuizAction(quizId: number): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);

  const quiz = await db.quiz.findUnique({ where: { id: quizId }, select: { seasonId: true } });
  if (!quiz) return { error: "Not found" };
  if (!canEditSeason(user, quiz.seasonId)) return { error: "Unauthorized" };

  await db.quiz.delete({ where: { id: quizId } });
  revalidatePath(`/admin/season`);
  return {};
}

const gradeEntrySchema = z.object({
  studentUserId: z.number().int().positive(),
  score: z.number().int().min(0).nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function saveQuizGradesAction(
  quizId: number,
  grades: { studentUserId: number; score: number | null; notes: string | null }[],
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["LEADER", "ADMIN", "SUPER"]);

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { seasonId: true, title: true },
  });
  if (!quiz) return { error: "Quiz not found" };

  if (user.role === "LEADER" && !(await isLeaderInSeason(user, quiz.seasonId))) {
    return { error: "Unauthorized" };
  }

  const parsed = z.array(gradeEntrySchema).safeParse(grades);
  if (!parsed.success) return { error: "Invalid grade data" };

  const now = new Date();
  const newlyGraded: number[] = [];

  // Batch-fetch existing grades to avoid N+1 queries
  const existingGrades = await db.quizGrade.findMany({
    where: { quizId, studentUserId: { in: parsed.data.map((g) => g.studentUserId) } },
    select: { studentUserId: true, gradedAt: true },
  });
  const existingMap = new Map(existingGrades.map((e) => [e.studentUserId, e]));

  for (const g of parsed.data) {
    if (g.score === null) continue;

    const wasUngraded = !existingMap.get(g.studentUserId)?.gradedAt;

    await db.quizGrade.upsert({
      where: { quizId_studentUserId: { quizId, studentUserId: g.studentUserId } },
      create: {
        quizId,
        studentUserId: g.studentUserId,
        score: g.score,
        notes: g.notes ?? null,
        gradedById: user.userId,
        gradedAt: now,
      },
      update: {
        score: g.score,
        notes: g.notes ?? null,
        gradedById: user.userId,
        gradedAt: now,
      },
    });

    if (wasUngraded) newlyGraded.push(g.studentUserId);
  }

  // Send QUIZ_GRADED notifications only for newly graded students.
  for (const studentUserId of newlyGraded) {
    await createNotification({
      userId: studentUserId,
      type: "QUIZ_GRADED",
      title: `Quiz graded: ${quiz.title}`,
      body: `Your quiz has been graded. Check your quiz results.`,
      link: `/student/quizzes`,
    });
  }

  revalidatePath(`/leader/sessions`);
  revalidatePath(`/leader/quizzes`);
  return {};
}

// ---------------------------------------------------------------------------
// ONLINE quizzes — question authoring
// ---------------------------------------------------------------------------

export interface QuizQuestionInput {
  type: QuizQuestionType;
  prompt: string;
  points: number;
  options: string[];
  correctIndex: number | null;
}

const questionSchema = z
  .object({
    type: z.enum(["MCQ", "ESSAY"]),
    prompt: z.string().trim().min(2).max(2000),
    points: z.number().int().min(1).max(100),
    options: z.array(z.string().trim().min(1).max(500)).max(6),
    correctIndex: z.number().int().min(0).nullable(),
  })
  .refine((d) => d.type === "ESSAY" || d.options.length >= 2, {
    message: "Add at least 2 options.",
    path: ["options"],
  })
  .refine(
    (d) =>
      d.type === "ESSAY" ||
      (d.correctIndex !== null && d.correctIndex < d.options.length),
    { message: "Mark the correct answer.", path: ["correctIndex"] },
  );

function normalizeQuestion(input: QuizQuestionInput) {
  const isEssay = input.type === "ESSAY";
  return {
    type: input.type,
    prompt: input.prompt.trim(),
    points: input.points,
    options: isEssay ? [] : input.options.map((o) => o.trim()),
    correctIndex: isEssay ? null : input.correctIndex,
  };
}

export async function addQuizQuestionAction(
  quizId: number,
  input: QuizQuestionInput,
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  if (!(await canManageQuiz(user, quizId))) throw new ForbiddenError();

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const count = await db.quizQuestion.count({ where: { quizId } });
  await db.quizQuestion.create({
    data: { quizId, order: count, ...normalizeQuestion(parsed.data) },
  });
  await recomputeQuizMaxScore(quizId);

  revalidatePath(`/admin/season`);
  return {};
}

export async function updateQuizQuestionAction(
  questionId: number,
  input: QuizQuestionInput,
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  if (!question) return { error: "Question not found." };
  if (!(await canManageQuiz(user, question.quizId))) throw new ForbiddenError();

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.quizQuestion.update({
    where: { id: questionId },
    data: normalizeQuestion(parsed.data),
  });
  await recomputeQuizMaxScore(question.quizId);

  revalidatePath(`/admin/season`);
  return {};
}

export async function deleteQuizQuestionAction(
  questionId: number,
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  if (!question) return { error: "Question not found." };
  if (!(await canManageQuiz(user, question.quizId))) throw new ForbiddenError();

  await db.quizQuestion.delete({ where: { id: questionId } });
  await recomputeQuizMaxScore(question.quizId);

  revalidatePath(`/admin/season`);
  return {};
}

export async function publishQuizAction(
  quizId: number,
  publish: boolean,
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  if (!(await canManageQuiz(user, quizId))) throw new ForbiddenError();

  if (publish) {
    const questions = await db.quizQuestion.findMany({
      where: { quizId },
      select: { type: true, correctIndex: true, options: true },
    });
    if (questions.length === 0) {
      return { error: "Add at least one question before publishing." };
    }
    const badMcq = questions.some(
      (q) =>
        q.type === "MCQ" &&
        (q.correctIndex === null || q.correctIndex >= q.options.length),
    );
    if (badMcq) {
      return { error: "Every multiple-choice question needs a correct answer." };
    }
  }

  await db.quiz.update({
    where: { id: quizId },
    data: { publishedAt: publish ? new Date() : null },
  });

  revalidatePath(`/admin/season`);
  revalidatePath(`/student/quizzes`);
  return {};
}

// ---------------------------------------------------------------------------
// ONLINE quizzes — student attempts
// ---------------------------------------------------------------------------

async function assertStudentCanAccessQuiz(
  userId: number,
  quizSeasonId: number,
): Promise<void> {
  const user = await getCurrentUserOrRedirect();
  if (user.userId !== userId || user.role !== "STUDENT") throw new ForbiddenError();
  if (!(await canAccessSeason(user, quizSeasonId))) throw new ForbiddenError();
}

export async function startQuizAttemptAction(
  quizId: number,
): Promise<{ error?: string; attemptId?: number }> {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { seasonId: true, kind: true, publishedAt: true },
  });
  if (!quiz) return { error: "Quiz not found." };
  if (quiz.kind !== "ONLINE" || quiz.publishedAt === null) {
    return { error: "This quiz is not available." };
  }
  await assertStudentCanAccessQuiz(user.userId, quiz.seasonId);

  const latest = await db.quizAttempt.findFirst({
    where: { quizId, studentUserId: user.userId },
    orderBy: { attemptNumber: "desc" },
    select: { id: true, status: true },
  });
  if (latest?.status === "IN_PROGRESS") return { attemptId: latest.id };
  if (latest) {
    return { error: "You've already submitted this quiz. Ask an admin to reopen it." };
  }

  const attempt = await db.quizAttempt.create({
    data: { quizId, studentUserId: user.userId, attemptNumber: 1 },
    select: { id: true },
  });
  return { attemptId: attempt.id };
}

const answerValueSchema = z.object({
  selectedIndex: z.number().int().min(0).max(5).nullable(),
  text: z.string().max(20000).nullable(),
});

export async function saveQuizAnswerAction(
  attemptId: number,
  questionId: number,
  value: { selectedIndex: number | null; text: string | null },
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { studentUserId: true, status: true, quizId: true },
  });
  if (!attempt) return { error: "Attempt not found." };
  if (attempt.studentUserId !== user.userId) throw new ForbiddenError();
  if (attempt.status !== "IN_PROGRESS") return { error: "This attempt is closed." };

  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  if (!question || question.quizId !== attempt.quizId) {
    return { error: "Question not found." };
  }

  const parsed = answerValueSchema.safeParse(value);
  if (!parsed.success) return { error: "Invalid answer." };

  await db.quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: {
      attemptId,
      questionId,
      selectedIndex: parsed.data.selectedIndex,
      text: parsed.data.text,
    },
    update: {
      selectedIndex: parsed.data.selectedIndex,
      text: parsed.data.text,
    },
  });
  return {};
}

export async function submitQuizAttemptAction(
  attemptId: number,
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      studentUserId: true,
      status: true,
      quizId: true,
      quiz: { select: { title: true } },
      answers: { select: { questionId: true, selectedIndex: true, text: true } },
    },
  });
  if (!attempt) return { error: "Attempt not found." };
  if (attempt.studentUserId !== user.userId) throw new ForbiddenError();
  if (attempt.status !== "IN_PROGRESS") return { error: "Already submitted." };

  const questions = await db.quizQuestion.findMany({
    where: { quizId: attempt.quizId },
    select: { id: true, type: true, points: true, correctIndex: true },
  });

  const answerByQuestion = new Map(
    attempt.answers.map((a) => [a.questionId, a]),
  );
  // Require every question to be answered.
  for (const q of questions) {
    const a = answerByQuestion.get(q.id);
    const answered =
      q.type === "MCQ"
        ? a?.selectedIndex !== null && a?.selectedIndex !== undefined
        : !!a?.text && a.text.trim().length > 0;
    if (!answered) return { error: "Please answer every question before submitting." };
  }

  let autoScore = 0;
  const hasEssays = questions.some((q) => q.type === "ESSAY");

  await db.$transaction(async (tx) => {
    for (const q of questions) {
      if (q.type !== "MCQ") continue;
      const a = answerByQuestion.get(q.id);
      const isCorrect = a?.selectedIndex === q.correctIndex;
      const pointsAwarded = isCorrect ? q.points : 0;
      autoScore += pointsAwarded;
      await tx.quizAnswer.update({
        where: { attemptId_questionId: { attemptId, questionId: q.id } },
        data: { isCorrect, pointsAwarded },
      });
    }

    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: hasEssays
        ? { status: "SUBMITTED", submittedAt: new Date(), autoScore }
        : {
            status: "GRADED",
            submittedAt: new Date(),
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            gradedAt: new Date(),
          },
    });
  });

  if (!hasEssays) {
    await createNotification({
      userId: user.userId,
      type: "QUIZ_GRADED",
      title: `Quiz graded: ${attempt.quiz.title}`,
      body: "Your quiz was auto-graded. Check your quiz results.",
      link: `/student/quizzes`,
    });
  }

  revalidatePath(`/student/quizzes`);
  revalidatePath(`/leader/quizzes`);
  return {};
}

// ---------------------------------------------------------------------------
// ONLINE quizzes — essay grading & retakes
// ---------------------------------------------------------------------------

export async function gradeEssayAnswersAction(
  attemptId: number,
  awards: { questionId: number; points: number }[],
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      quizId: true,
      studentUserId: true,
      autoScore: true,
      status: true,
      quiz: { select: { title: true } },
    },
  });
  if (!attempt) return { error: "Attempt not found." };
  if (!(await canGradeQuiz(user, attempt.quizId))) throw new ForbiddenError();
  if (attempt.status === "IN_PROGRESS") return { error: "Not submitted yet." };

  const essayQuestions = await db.quizQuestion.findMany({
    where: { quizId: attempt.quizId, type: "ESSAY" },
    select: { id: true, points: true },
  });
  const maxByQuestion = new Map(essayQuestions.map((q) => [q.id, q.points]));

  let manualScore = 0;
  await db.$transaction(async (tx) => {
    for (const award of awards) {
      const max = maxByQuestion.get(award.questionId);
      if (max === undefined) continue;
      const points = Math.max(0, Math.min(max, Math.round(award.points)));
      manualScore += points;
      await tx.quizAnswer.update({
        where: {
          attemptId_questionId: { attemptId, questionId: award.questionId },
        },
        data: { pointsAwarded: points },
      });
    }

    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        manualScore,
        totalScore: (attempt.autoScore ?? 0) + manualScore,
        status: "GRADED",
        gradedById: user.userId,
        gradedAt: new Date(),
      },
    });
  });

  await createNotification({
    userId: attempt.studentUserId,
    type: "QUIZ_GRADED",
    title: `Quiz graded: ${attempt.quiz.title}`,
    body: "Your quiz has been graded. Check your quiz results.",
    link: `/student/quizzes`,
  });

  revalidatePath(`/student/quizzes`);
  revalidatePath(`/leader/quizzes`);
  revalidatePath(`/admin/season`);
  return {};
}

// Admin-only retake: opens a fresh attempt so the student can try again.
export async function reopenQuizAttemptAction(
  quizId: number,
  studentUserId: number,
): Promise<{ error?: string }> {
  const user = await getCurrentUserOrRedirect();
  if (!(await canManageQuiz(user, quizId))) throw new ForbiddenError();

  const latest = await db.quizAttempt.findFirst({
    where: { quizId, studentUserId },
    orderBy: { attemptNumber: "desc" },
    select: { attemptNumber: true, status: true },
  });
  if (!latest) return { error: "No attempt to reopen." };
  if (latest.status === "IN_PROGRESS") return { error: "An attempt is already open." };

  await db.quizAttempt.create({
    data: {
      quizId,
      studentUserId,
      attemptNumber: latest.attemptNumber + 1,
    },
  });

  revalidatePath(`/student/quizzes`);
  revalidatePath(`/admin/season`);
  return {};
}
