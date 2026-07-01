"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ConfirmDialog,
} from "@/components/ui/confirm-dialog";
import {
  startQuizAttemptAction,
  saveQuizAnswerAction,
  submitQuizAttemptAction,
} from "@/lib/quiz-actions";
import type { StudentQuizData, StudentQuizQuestion } from "@/lib/quiz-query";

interface Props {
  quiz: StudentQuizData;
}

export function QuizRunner({ quiz }: Props) {
  if (quiz.status === null) return <NotStarted quiz={quiz} />;
  if (quiz.status === "IN_PROGRESS") return <InProgress quiz={quiz} />;
  return <Result quiz={quiz} />;
}

function NotStarted({ quiz }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startQuizAttemptAction(quiz.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-muted-foreground">
        {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} · {quiz.maxScore} points.
        You have one attempt — answer every question before submitting.
      </p>
      <Button onClick={start} disabled={isPending} className="self-start">
        {isPending ? "Starting…" : "Start quiz"}
      </Button>
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
}

function InProgress({ quiz }: Props) {
  const router = useRouter();
  const attemptId = quiz.attemptId!;
  const [answers, setAnswers] = useState<Record<number, { selectedIndex: number | null; text: string }>>(
    () => {
      const init: Record<number, { selectedIndex: number | null; text: string }> = {};
      for (const q of quiz.questions) {
        init[q.id] = { selectedIndex: q.selectedIndex, text: q.text ?? "" };
      }
      return init;
    },
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function selectMcq(q: StudentQuizQuestion, index: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: { selectedIndex: index, text: "" } }));
    void saveQuizAnswerAction(attemptId, q.id, { selectedIndex: index, text: null });
  }

  function setEssay(q: StudentQuizQuestion, text: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: { selectedIndex: null, text } }));
  }

  function saveEssay(q: StudentQuizQuestion) {
    void saveQuizAnswerAction(attemptId, q.id, {
      selectedIndex: null,
      text: answers[q.id]?.text ?? "",
    });
  }

  const allAnswered = quiz.questions.every((q) => {
    const a = answers[q.id];
    return q.type === "MCQ" ? a?.selectedIndex !== null : (a?.text ?? "").trim().length > 0;
  });

  function submit() {
    setError(null);
    startTransition(async () => {
      // Persist everything, then submit.
      await Promise.all(
        quiz.questions.map((q) =>
          saveQuizAnswerAction(attemptId, q.id, {
            selectedIndex: answers[q.id]?.selectedIndex ?? null,
            text: answers[q.id]?.text ? answers[q.id].text : null,
          }),
        ),
      );
      const result = await submitQuizAttemptAction(attemptId);
      setConfirmOpen(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {quiz.questions.map((q, i) => (
        <div key={q.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
            <Badge variant={q.type === "MCQ" ? "teal" : "outline"}>
              {q.type === "MCQ" ? "Multiple choice" : "Essay"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {q.points} pt{q.points === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-brand-navy-900 dark:text-foreground">{q.prompt}</p>

          {q.type === "MCQ" ? (
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt, idx) => {
                const selected = answers[q.id]?.selectedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectMcq(q, idx)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "border-brand-teal-600 bg-brand-teal-600/10 text-brand-teal-700 dark:text-brand-teal-300"
                        : "border-border bg-card text-foreground hover:border-brand-teal-500"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-brand-teal-600 bg-brand-teal-600 text-white" : "border-border"
                      }`}
                    >
                      {selected && <Check className="size-3" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              className="mt-3"
              value={answers[q.id]?.text ?? ""}
              onChange={(e) => setEssay(q, e.target.value)}
              onBlur={() => saveEssay(q)}
              placeholder="Write your answer…"
            />
          )}
        </div>
      ))}

      {error && <p className="text-xs text-error-600">{error}</p>}

      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={!allAnswered || isPending}
        className="self-start"
      >
        Submit quiz
      </Button>
      {!allAnswered && (
        <p className="text-xs text-muted-foreground">Answer every question to submit.</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit quiz?"
        description="You can't change your answers after submitting."
        confirmLabel="Submit"
        pending={isPending}
        onConfirm={submit}
      />
    </div>
  );
}

function Result({ quiz }: Props) {
  const graded = quiz.status === "GRADED";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div>
          <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">
            {graded ? "Graded" : "Submitted"}
          </p>
          <p className="text-xs text-muted-foreground">
            {graded
              ? "Your quiz has been graded."
              : "Awaiting grading for the written answers."}
          </p>
        </div>
        {graded ? (
          <div className="text-right">
            <p className="text-2xl font-black text-brand-teal-700 dark:text-brand-teal-300">
              {quiz.totalScore}
              <span className="text-sm font-semibold text-muted-foreground">/{quiz.maxScore}</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Score</p>
          </div>
        ) : (
          <Badge variant="warning">
            <Clock className="size-3" />
            Pending
          </Badge>
        )}
      </div>

      {quiz.questions.map((q, i) => (
        <div key={q.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
            {q.type === "MCQ" && q.isCorrect !== null ? (
              q.isCorrect ? (
                <Badge variant="success">
                  <Check className="size-3" /> Correct
                </Badge>
              ) : (
                <Badge variant="error">
                  <X className="size-3" /> Incorrect
                </Badge>
              )
            ) : (
              <span className="text-xs text-muted-foreground">
                {q.pointsAwarded !== null ? `${q.pointsAwarded}/${q.points} pts` : `${q.points} pts`}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-brand-navy-900 dark:text-foreground">{q.prompt}</p>
          {q.type === "MCQ" ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Your answer: {q.selectedIndex !== null ? q.options[q.selectedIndex] : "—"}
            </p>
          ) : (
            <p className="mt-1 whitespace-pre-line rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground">
              {q.text || "—"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
