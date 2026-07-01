import { db } from "@/lib/db";

// Full question shape for the admin authoring editor — includes the correct
// answer, which is never sent to students before they answer.
export interface VideoQuestionAdmin {
  id: number;
  atSeconds: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
  responseCount: number;
}

// Question shape for student playback — the correct answer is withheld; the
// student's own prior answer (if any) is included so we can render feedback.
export interface StudentVideoQuestion {
  id: number;
  atSeconds: number;
  prompt: string;
  options: string[];
  points: number;
  answered: boolean;
  selectedIndex: number | null;
  isCorrect: boolean | null;
}

export interface StudentVideoQuiz {
  questions: StudentVideoQuestion[];
  furthestSeconds: number;
  completedAt: Date | null;
  earnedPoints: number;
  totalPoints: number;
  answeredCount: number;
}

export async function listVideoQuestions(
  sessionId: number,
): Promise<VideoQuestionAdmin[]> {
  const rows = await db.sessionVideoQuestion.findMany({
    where: { sessionId },
    orderBy: { atSeconds: "asc" },
    select: {
      id: true,
      atSeconds: true,
      prompt: true,
      options: true,
      correctIndex: true,
      points: true,
      _count: { select: { responses: true } },
    },
  });
  return rows.map((q) => ({
    id: q.id,
    atSeconds: q.atSeconds,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    points: q.points,
    responseCount: q._count.responses,
  }));
}

export async function loadStudentVideoQuiz(
  sessionId: number,
  studentUserId: number,
): Promise<StudentVideoQuiz> {
  const [questions, responses, progress] = await Promise.all([
    db.sessionVideoQuestion.findMany({
      where: { sessionId },
      orderBy: { atSeconds: "asc" },
      select: { id: true, atSeconds: true, prompt: true, options: true, points: true },
    }),
    db.sessionVideoQuestionResponse.findMany({
      where: { studentUserId, question: { sessionId } },
      select: { questionId: true, selectedIndex: true, isCorrect: true },
    }),
    db.sessionVideoProgress.findUnique({
      where: { sessionId_studentUserId: { sessionId, studentUserId } },
      select: { furthestSeconds: true, completedAt: true },
    }),
  ]);

  const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

  let earnedPoints = 0;
  let totalPoints = 0;
  const mapped = questions.map((q) => {
    totalPoints += q.points;
    const r = responseByQuestion.get(q.id);
    if (r?.isCorrect) earnedPoints += q.points;
    return {
      id: q.id,
      atSeconds: q.atSeconds,
      prompt: q.prompt,
      options: q.options,
      points: q.points,
      answered: r !== undefined,
      selectedIndex: r?.selectedIndex ?? null,
      isCorrect: r?.isCorrect ?? null,
    };
  });

  return {
    questions: mapped,
    furthestSeconds: progress?.furthestSeconds ?? 0,
    completedAt: progress?.completedAt ?? null,
    earnedPoints,
    totalPoints,
    answeredCount: responses.length,
  };
}
