import { db } from "@/lib/db";
import type {
  QuizKind,
  QuizQuestionType,
  QuizAttemptStatus,
} from "@/generated/prisma/enums";

export interface QuizSummary {
  id: number;
  title: string;
  kind: QuizKind;
  publishedAt: Date | null;
  questionCount: number;
  maxScore: number;
  sessionId: number | null;
  sessionTitle: string | null;
  sessionDate: Date | null;
  seasonId: number;
  gradedCount: number;
}

export interface QuizWithGrades {
  id: number;
  title: string;
  maxScore: number;
  seasonId: number;
  sessionId: number | null;
  sessionTitle: string | null;
  grades: {
    studentUserId: number;
    studentName: string;
    score: number | null;
    notes: string | null;
    gradedAt: Date | null;
  }[];
}

export interface StudentQuizResult {
  quizId: number;
  title: string;
  kind: QuizKind;
  maxScore: number;
  score: number | null;
  notes: string | null;
  gradedAt: Date | null;
  sessionTitle: string | null;
  sessionDate: Date | null;
  // ONLINE only: latest attempt status (null = not started).
  attemptStatus: QuizAttemptStatus | null;
}

export interface QuizBuilderQuestion {
  id: number;
  order: number;
  type: QuizQuestionType;
  prompt: string;
  points: number;
  options: string[];
  correctIndex: number | null;
}

export interface QuizBuilderData {
  id: number;
  title: string;
  kind: QuizKind;
  seasonId: number;
  seasonCode: string;
  sessionId: number | null;
  publishedAt: Date | null;
  maxScore: number;
  questions: QuizBuilderQuestion[];
}

export interface StudentQuizQuestion {
  id: number;
  order: number;
  type: QuizQuestionType;
  prompt: string;
  points: number;
  options: string[];
  // The student's saved answer in the active attempt (for resume / review).
  selectedIndex: number | null;
  text: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export interface StudentQuizData {
  id: number;
  title: string;
  kind: QuizKind;
  seasonId: number;
  maxScore: number;
  sessionTitle: string | null;
  attemptId: number | null;
  attemptNumber: number;
  status: QuizAttemptStatus | null;
  autoScore: number | null;
  manualScore: number | null;
  totalScore: number | null;
  questions: StudentQuizQuestion[];
}

export interface GradingAnswer {
  questionId: number;
  type: QuizQuestionType;
  prompt: string;
  points: number;
  options: string[];
  correctIndex: number | null;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  text: string | null;
  pointsAwarded: number | null;
}

export interface GradingAttempt {
  attemptId: number;
  studentUserId: number;
  studentName: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  autoScore: number | null;
  manualScore: number | null;
  totalScore: number | null;
  submittedAt: Date | null;
  answers: GradingAnswer[];
}

export interface QuizGradingData {
  id: number;
  title: string;
  kind: QuizKind;
  maxScore: number;
  seasonId: number;
  sessionId: number | null;
  hasEssays: boolean;
  attempts: GradingAttempt[];
}

export async function listQuizzesForSession(sessionId: number): Promise<QuizSummary[]> {
  const quizzes = await db.quiz.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      kind: true,
      publishedAt: true,
      maxScore: true,
      sessionId: true,
      seasonId: true,
      session: { select: { title: true, startsAt: true } },
      grades: { select: { id: true } },
      _count: { select: { questions: true } },
    },
  });
  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    kind: q.kind,
    publishedAt: q.publishedAt,
    questionCount: q._count.questions,
    maxScore: q.maxScore,
    sessionId: q.sessionId,
    sessionTitle: q.session?.title ?? null,
    sessionDate: q.session?.startsAt ?? null,
    seasonId: q.seasonId,
    gradedCount: q.grades.length,
  }));
}

export async function listQuizzesForSeason(seasonId: number): Promise<QuizSummary[]> {
  const quizzes = await db.quiz.findMany({
    where: { seasonId },
    orderBy: [{ session: { startsAt: "desc" } }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      kind: true,
      publishedAt: true,
      maxScore: true,
      sessionId: true,
      seasonId: true,
      session: { select: { title: true, startsAt: true } },
      grades: { select: { id: true } },
      _count: { select: { questions: true } },
    },
  });
  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    kind: q.kind,
    publishedAt: q.publishedAt,
    questionCount: q._count.questions,
    maxScore: q.maxScore,
    sessionId: q.sessionId,
    sessionTitle: q.session?.title ?? null,
    sessionDate: q.session?.startsAt ?? null,
    seasonId: q.seasonId,
    gradedCount: q.grades.length,
  }));
}

export async function loadQuizWithGrades(
  quizId: number,
  studentUserIds: number[],
): Promise<QuizWithGrades | null> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      maxScore: true,
      seasonId: true,
      sessionId: true,
      session: { select: { title: true } },
    },
  });
  if (!quiz) return null;

  const [students, grades] = await Promise.all([
    db.user.findMany({
      where: { id: { in: studentUserIds }, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.quizGrade.findMany({
      where: { quizId, studentUserId: { in: studentUserIds } },
      select: { studentUserId: true, score: true, notes: true, gradedAt: true },
    }),
  ]);

  const gradeMap = new Map(grades.map((g) => [g.studentUserId, g]));

  return {
    id: quiz.id,
    title: quiz.title,
    maxScore: quiz.maxScore,
    seasonId: quiz.seasonId,
    sessionId: quiz.sessionId,
    sessionTitle: quiz.session?.title ?? null,
    grades: students.map((s) => {
      const g = gradeMap.get(s.id);
      return {
        studentUserId: s.id,
        studentName: s.name ?? "",
        score: g?.score ?? null,
        notes: g?.notes ?? null,
        gradedAt: g?.gradedAt ?? null,
      };
    }),
  };
}

export async function listQuizResultsForStudent(
  studentUserId: number,
  seasonId: number,
): Promise<StudentQuizResult[]> {
  const [grades, onlineQuizzes] = await Promise.all([
    db.quizGrade.findMany({
      where: { studentUserId, quiz: { seasonId, kind: "PAPER" } },
      orderBy: { quiz: { session: { startsAt: "desc" } } },
      select: {
        score: true,
        notes: true,
        gradedAt: true,
        quiz: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            session: { select: { title: true, startsAt: true } },
          },
        },
      },
    }),
    db.quiz.findMany({
      where: { seasonId, kind: "ONLINE", publishedAt: { not: null } },
      orderBy: { session: { startsAt: "desc" } },
      select: {
        id: true,
        title: true,
        maxScore: true,
        session: { select: { title: true, startsAt: true } },
        attempts: {
          where: { studentUserId },
          orderBy: { attemptNumber: "desc" },
          take: 1,
          select: { status: true, totalScore: true, gradedAt: true },
        },
      },
    }),
  ]);

  const paperRows: StudentQuizResult[] = grades.map((g) => ({
    quizId: g.quiz.id,
    title: g.quiz.title,
    kind: "PAPER",
    maxScore: g.quiz.maxScore,
    score: g.score,
    notes: g.notes,
    gradedAt: g.gradedAt,
    sessionTitle: g.quiz.session?.title ?? null,
    sessionDate: g.quiz.session?.startsAt ?? null,
    attemptStatus: null,
  }));

  const onlineRows: StudentQuizResult[] = onlineQuizzes.map((q) => {
    const attempt = q.attempts[0];
    const status = attempt?.status ?? null;
    return {
      quizId: q.id,
      title: q.title,
      kind: "ONLINE",
      maxScore: q.maxScore,
      score: status === "GRADED" ? attempt?.totalScore ?? null : null,
      notes: null,
      gradedAt: attempt?.gradedAt ?? null,
      sessionTitle: q.session?.title ?? null,
      sessionDate: q.session?.startsAt ?? null,
      attemptStatus: status,
    };
  });

  return [...paperRows, ...onlineRows].sort(
    (a, b) => (b.sessionDate?.getTime() ?? 0) - (a.sessionDate?.getTime() ?? 0),
  );
}

export async function loadQuizBuilder(
  quizId: number,
): Promise<QuizBuilderData | null> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      kind: true,
      seasonId: true,
      sessionId: true,
      publishedAt: true,
      maxScore: true,
      season: { select: { code: true } },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          type: true,
          prompt: true,
          points: true,
          options: true,
          correctIndex: true,
        },
      },
    },
  });
  if (!quiz) return null;
  return {
    id: quiz.id,
    title: quiz.title,
    kind: quiz.kind,
    seasonId: quiz.seasonId,
    seasonCode: quiz.season.code,
    sessionId: quiz.sessionId,
    publishedAt: quiz.publishedAt,
    maxScore: quiz.maxScore,
    questions: quiz.questions,
  };
}

// Student take/review view. Never selects correctIndex — grading happens
// server-side. Returns null for non-online or unpublished quizzes.
export async function loadQuizForStudent(
  quizId: number,
  studentUserId: number,
): Promise<StudentQuizData | null> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      kind: true,
      seasonId: true,
      maxScore: true,
      publishedAt: true,
      session: { select: { title: true } },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          type: true,
          prompt: true,
          points: true,
          options: true,
        },
      },
    },
  });
  if (!quiz || quiz.kind !== "ONLINE" || quiz.publishedAt === null) return null;

  const attempt = await db.quizAttempt.findFirst({
    where: { quizId, studentUserId },
    orderBy: { attemptNumber: "desc" },
    select: {
      id: true,
      attemptNumber: true,
      status: true,
      autoScore: true,
      manualScore: true,
      totalScore: true,
      answers: {
        select: {
          questionId: true,
          selectedIndex: true,
          text: true,
          isCorrect: true,
          pointsAwarded: true,
        },
      },
    },
  });
  const answerByQuestion = new Map(
    (attempt?.answers ?? []).map((a) => [a.questionId, a]),
  );

  return {
    id: quiz.id,
    title: quiz.title,
    kind: quiz.kind,
    seasonId: quiz.seasonId,
    maxScore: quiz.maxScore,
    sessionTitle: quiz.session?.title ?? null,
    attemptId: attempt?.id ?? null,
    attemptNumber: attempt?.attemptNumber ?? 0,
    status: attempt?.status ?? null,
    autoScore: attempt?.autoScore ?? null,
    manualScore: attempt?.manualScore ?? null,
    totalScore: attempt?.totalScore ?? null,
    questions: quiz.questions.map((q) => {
      const a = answerByQuestion.get(q.id);
      return {
        id: q.id,
        order: q.order,
        type: q.type,
        prompt: q.prompt,
        points: q.points,
        options: q.options,
        selectedIndex: a?.selectedIndex ?? null,
        text: a?.text ?? null,
        isCorrect: a?.isCorrect ?? null,
        pointsAwarded: a?.pointsAwarded ?? null,
      };
    }),
  };
}

// Grader view: the latest submitted/graded attempt per student in scope.
export async function loadQuizForGrading(
  quizId: number,
  studentUserIds: number[],
): Promise<QuizGradingData | null> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      kind: true,
      maxScore: true,
      seasonId: true,
      sessionId: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          prompt: true,
          points: true,
          options: true,
          correctIndex: true,
        },
      },
    },
  });
  if (!quiz) return null;

  const attempts = await db.quizAttempt.findMany({
    where: {
      quizId,
      studentUserId: { in: studentUserIds },
      status: { in: ["SUBMITTED", "GRADED"] },
    },
    orderBy: [{ studentUserId: "asc" }, { attemptNumber: "desc" }],
    distinct: ["studentUserId"],
    select: {
      id: true,
      studentUserId: true,
      attemptNumber: true,
      status: true,
      autoScore: true,
      manualScore: true,
      totalScore: true,
      submittedAt: true,
      studentUser: { select: { name: true } },
      answers: {
        select: {
          questionId: true,
          selectedIndex: true,
          text: true,
          isCorrect: true,
          pointsAwarded: true,
        },
      },
    },
  });

  return {
    id: quiz.id,
    title: quiz.title,
    kind: quiz.kind,
    maxScore: quiz.maxScore,
    seasonId: quiz.seasonId,
    sessionId: quiz.sessionId,
    hasEssays: quiz.questions.some((q) => q.type === "ESSAY"),
    attempts: attempts.map((att) => {
      const answerByQuestion = new Map(
        att.answers.map((a) => [a.questionId, a]),
      );
      return {
        attemptId: att.id,
        studentUserId: att.studentUserId,
        studentName: att.studentUser.name ?? "",
        attemptNumber: att.attemptNumber,
        status: att.status,
        autoScore: att.autoScore,
        manualScore: att.manualScore,
        totalScore: att.totalScore,
        submittedAt: att.submittedAt,
        answers: quiz.questions.map((q) => {
          const a = answerByQuestion.get(q.id);
          return {
            questionId: q.id,
            type: q.type,
            prompt: q.prompt,
            points: q.points,
            options: q.options,
            correctIndex: q.correctIndex,
            selectedIndex: a?.selectedIndex ?? null,
            isCorrect: a?.isCorrect ?? null,
            text: a?.text ?? null,
            pointsAwarded: a?.pointsAwarded ?? null,
          };
        }),
      };
    }),
  };
}
