"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  gradeEssayAnswersAction,
  reopenQuizAttemptAction,
} from "@/lib/quiz-actions";
import type { QuizGradingData, GradingAttempt } from "@/lib/quiz-query";

interface Props {
  data: QuizGradingData;
  canReopen: boolean;
}

export function QuizEssayGrader({ data, canReopen }: Props) {
  if (data.attempts.length === 0) {
    return (
      <EmptyState
        title="No submissions yet"
        description="Student attempts will appear here once they submit this quiz."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.attempts.map((attempt) => (
        <StudentGradeCard
          key={attempt.attemptId}
          quizId={data.id}
          maxScore={data.maxScore}
          hasEssays={data.hasEssays}
          attempt={attempt}
          canReopen={canReopen}
        />
      ))}
    </div>
  );
}

interface CardProps {
  quizId: number;
  maxScore: number;
  hasEssays: boolean;
  attempt: GradingAttempt;
  canReopen: boolean;
}

function StudentGradeCard({ quizId, maxScore, hasEssays, attempt, canReopen }: CardProps) {
  const router = useRouter();
  const [awards, setAwards] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const a of attempt.answers) {
      if (a.type === "ESSAY") init[a.questionId] = a.pointsAwarded?.toString() ?? "";
    }
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveGrade() {
    setError(null);
    const parsed: { questionId: number; points: number }[] = [];
    for (const a of attempt.answers) {
      if (a.type !== "ESSAY") continue;
      const raw = awards[a.questionId] ?? "";
      const num = parseInt(raw, 10);
      if (isNaN(num) || num < 0 || num > a.points) {
        setError(`Enter 0–${a.points} points for each written answer.`);
        return;
      }
      parsed.push({ questionId: a.questionId, points: num });
    }
    startTransition(async () => {
      const result = await gradeEssayAnswersAction(attempt.attemptId, parsed);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function reopen() {
    startTransition(async () => {
      await reopenQuizAttemptAction(quizId, attempt.studentUserId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">{attempt.studentName}</p>
          <p className="text-xs text-muted-foreground">
            Attempt {attempt.attemptNumber} ·{" "}
            {attempt.status === "GRADED"
              ? `Graded · ${attempt.totalScore}/${maxScore}`
              : "Awaiting grading"}
          </p>
        </div>
        <Badge variant={attempt.status === "GRADED" ? "success" : "warning"}>
          {attempt.status === "GRADED" ? "Graded" : "Submitted"}
        </Badge>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {attempt.answers.map((a) => (
          <div key={a.questionId} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm font-semibold text-brand-navy-900 dark:text-foreground">{a.prompt}</p>
            {a.type === "MCQ" ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                {a.isCorrect ? (
                  <Check className="size-4 text-success-600" />
                ) : (
                  <X className="size-4 text-error-600" />
                )}
                <span>
                  {a.selectedIndex !== null ? a.options[a.selectedIndex] : "—"}
                  {a.correctIndex !== null && !a.isCorrect && (
                    <span className="text-success-700 dark:text-success-300">
                      {" "}
                      (correct: {a.options[a.correctIndex]})
                    </span>
                  )}
                </span>
                <span className="ml-auto text-xs">{a.pointsAwarded ?? 0}/{a.points}</span>
              </div>
            ) : (
              <div className="mt-1 flex flex-col gap-2">
                <p className="whitespace-pre-line rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {a.text || "—"}
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Points</label>
                  <Input
                    type="number"
                    size="sm"
                    min={0}
                    max={a.points}
                    value={awards[a.questionId] ?? ""}
                    onChange={(e) =>
                      setAwards((prev) => ({ ...prev, [a.questionId]: e.target.value }))
                    }
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">/ {a.points}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-error-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {hasEssays && (
          <Button size="sm" onClick={saveGrade} disabled={isPending}>
            {isPending ? "Saving…" : attempt.status === "GRADED" ? "Update grade" : "Save grade"}
          </Button>
        )}
        {canReopen && attempt.status === "GRADED" && (
          <Button size="sm" variant="outline" onClick={reopen} disabled={isPending}>
            <RotateCcw className="size-4" />
            Reopen retake
          </Button>
        )}
      </div>
    </div>
  );
}
