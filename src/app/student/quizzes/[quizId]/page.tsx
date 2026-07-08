import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole, canAccessSeason } from "@/lib/auth/permissions";
import { loadQuizForStudent } from "@/lib/quiz-query";
import { QuizRunner } from "@/components/quizzes/quiz-runner";

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export const metadata: Metadata = { title: "Quiz" };

export default async function StudentQuizPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const { quizId } = await params;
  const quiz = await loadQuizForStudent(Number(quizId), user.userId);
  if (!quiz) notFound();
  if (!(await canAccessSeason(user, quiz.seasonId))) notFound();

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div>
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal-700 hover:underline dark:text-brand-teal-300"
        >
          <ArrowLeft className="size-3" />
          Quizzes
        </Link>
        <h1 className="mt-1 text-xl font-black text-brand-navy-900 dark:text-foreground">{quiz.title}</h1>
        {quiz.sessionTitle && (
          <p className="text-sm text-muted-foreground">{quiz.sessionTitle}</p>
        )}
      </div>

      <QuizRunner quiz={quiz} />
    </div>
  );
}
