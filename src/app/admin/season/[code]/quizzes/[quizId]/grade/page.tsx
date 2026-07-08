import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole, canGradeQuiz } from "@/lib/auth/permissions";
import { loadSeasonByCode } from "@/lib/seasons-query";
import { loadQuizWithGrades, loadQuizForGrading } from "@/lib/quiz-query";
import { QuizGradeForm } from "@/components/quizzes/quiz-grade-form";
import { QuizEssayGrader } from "@/components/quizzes/quiz-essay-grader";

interface PageProps {
  params: Promise<{ code: string; quizId: string }>;
}

export const metadata: Metadata = { title: "Grade quiz" };

export default async function AdminQuizGradePage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);

  const { code, quizId } = await params;
  const season = await loadSeasonByCode(code);
  const quizIdNum = Number(quizId);

  if (!(await canGradeQuiz(user, quizIdNum))) redirect("/admin/season");

  const quiz = await db.quiz.findUnique({
    where: { id: quizIdNum },
    select: { seasonId: true, sessionId: true, kind: true, title: true },
  });
  if (!quiz || quiz.seasonId !== season.id) notFound();

  const studentIds = await db.seasonEnrollment
    .findMany({
      where: { seasonId: season.id, status: "ACTIVE" },
      select: { studentUserId: true },
    })
    .then((rows) => rows.map((r) => r.studentUserId));

  const backHref = quiz.sessionId
    ? `/admin/season/${season.code}/sessions/${quiz.sessionId}`
    : `/admin/season/${season.code}`;

  const header = (
    <div>
      <Link
        href={backHref}
        className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
      >
        <ArrowLeft className="size-3" />
        Back to session
      </Link>
      <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">{quiz.title}</h1>
    </div>
  );

  if (quiz.kind === "ONLINE") {
    const grading = await loadQuizForGrading(quizIdNum, studentIds);
    if (!grading) notFound();
    return (
      <div className="flex flex-col gap-4">
        {header}
        <QuizEssayGrader data={grading} canReopen />
      </div>
    );
  }

  const data = await loadQuizWithGrades(quizIdNum, studentIds);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-4">
      {header}
      <p className="-mt-2 text-sm text-muted-foreground">
        {data.sessionTitle ? `${data.sessionTitle} · ` : ""}Max score: {data.maxScore}
      </p>
      <QuizGradeForm quizId={data.id} maxScore={data.maxScore} initialGrades={data.grades} />
    </div>
  );
}
