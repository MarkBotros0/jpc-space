import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole, canManageQuiz } from "@/lib/auth/permissions";
import { loadSeasonByCode } from "@/lib/seasons-query";
import { loadQuizBuilder } from "@/lib/quiz-query";
import { QuizBuilder } from "@/components/quizzes/quiz-builder";

interface PageProps {
  params: Promise<{ code: string; quizId: string }>;
}

export const metadata: Metadata = { title: "Edit quiz" };

export default async function QuizBuilderPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);

  const { code, quizId } = await params;
  const season = await loadSeasonByCode(code);
  const quizIdNum = Number(quizId);

  if (!(await canManageQuiz(user, quizIdNum))) redirect("/admin/season");

  const quiz = await loadQuizBuilder(quizIdNum);
  if (!quiz || quiz.seasonId !== season.id) notFound();
  if (quiz.kind !== "ONLINE") {
    redirect(`/admin/season/${season.code}/sessions/${quiz.sessionId ?? ""}`);
  }

  const backHref = quiz.sessionId
    ? `/admin/season/${season.code}/sessions/${quiz.sessionId}`
    : `/admin/season/${season.code}`;

  return (
    <div className="flex flex-col gap-4">
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

      <QuizBuilder quiz={quiz} />
    </div>
  );
}
