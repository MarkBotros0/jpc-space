"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  addQuizQuestionAction,
  updateQuizQuestionAction,
  deleteQuizQuestionAction,
  publishQuizAction,
  type QuizQuestionInput,
} from "@/lib/quiz-actions";
import type { QuizBuilderData, QuizBuilderQuestion } from "@/lib/quiz-query";
import type { QuizQuestionType } from "@/generated/prisma/enums";

interface Props {
  quiz: QuizBuilderData;
}

export function QuizBuilder({ quiz }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const published = quiz.publishedAt !== null;

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishQuizAction(quiz.id, !published);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (deleteId === null) return;
    startTransition(async () => {
      await deleteQuizQuestionAction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Publish bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={published ? "success" : "warning"}>
            {published ? "Published" : "Draft"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} · {quiz.maxScore} pts
          </span>
        </div>
        <Button
          variant={published ? "outline" : "default"}
          size="sm"
          onClick={handlePublish}
          disabled={isPending}
        >
          {published ? "Unpublish" : "Publish"}
        </Button>
      </div>
      {error && <p className="text-xs text-error-600">{error}</p>}

      {/* Questions */}
      {quiz.questions.length === 0 && !adding ? (
        <EmptyState
          title="No questions yet"
          description="Add multiple-choice or essay questions, then publish the quiz."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {quiz.questions.map((q, i) =>
            editingId === q.id ? (
              <li key={q.id}>
                <QuestionForm
                  quizId={quiz.id}
                  initial={q}
                  onDone={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={q.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                    <Badge variant={q.type === "MCQ" ? "teal" : "outline"}>
                      {q.type === "MCQ" ? "Multiple choice" : "Essay"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {q.points} pt{q.points === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-brand-navy-900 dark:text-foreground">
                    {q.prompt}
                  </p>
                  {q.type === "MCQ" && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Correct: {q.correctIndex !== null ? q.options[q.correctIndex] : "—"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Edit question"
                    onClick={() => setEditingId(q.id)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Delete question"
                    onClick={() => setDeleteId(q.id)}
                  >
                    <Trash2 className="size-4 text-error-600" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {adding ? (
        <QuestionForm
          quizId={quiz.id}
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" />
          Add question
        </Button>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete question?"
        description="This removes the question and any recorded answers. This cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface FormProps {
  quizId: number;
  initial?: QuizBuilderQuestion;
  onDone: () => void;
  onCancel: () => void;
}

function QuestionForm({ quizId, initial, onDone, onCancel }: FormProps) {
  const [type, setType] = useState<QuizQuestionType>(initial?.type ?? "MCQ");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [points, setPoints] = useState(String(initial?.points ?? 1));
  const [options, setOptions] = useState<string[]>(
    initial && initial.options.length > 0 ? initial.options : ["", ""],
  );
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    setCorrectIndex((prev) => (prev === i ? 0 : prev > i ? prev - 1 : prev));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (prompt.trim().length < 2) {
      setError("Enter a question prompt.");
      return;
    }
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts < 1) {
      setError("Points must be at least 1.");
      return;
    }
    if (type === "MCQ" && options.some((o) => o.trim().length === 0)) {
      setError("Every option needs text.");
      return;
    }

    const input: QuizQuestionInput = {
      type,
      prompt: prompt.trim(),
      points: pts,
      options: type === "MCQ" ? options.map((o) => o.trim()) : [],
      correctIndex: type === "MCQ" ? correctIndex : null,
    };

    startTransition(async () => {
      const result = initial
        ? await updateQuizQuestionAction(initial.id, input)
        : await addQuizQuestionAction(quizId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-brand-teal-600/40 bg-card p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {(["MCQ", "ESSAY"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              type === t
                ? "border-brand-teal-600 bg-brand-teal-600/10 text-brand-teal-700 dark:text-brand-teal-300"
                : "border-border text-muted-foreground hover:border-brand-teal-500"
            }`}
          >
            {t === "MCQ" ? "Multiple choice" : "Essay"}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <label className="text-xs font-semibold text-muted-foreground">Points</label>
          <Input
            type="number"
            size="sm"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-16"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground">Question</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What is…?"
          className="min-h-16"
          required
        />
      </div>

      {type === "MCQ" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Options (tap the circle to mark the correct answer)
          </label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Mark option ${i + 1} correct`}
                aria-pressed={correctIndex === i}
                onClick={() => setCorrectIndex(i)}
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  correctIndex === i
                    ? "border-success-600 bg-success-600 text-white"
                    : "border-border text-transparent hover:border-success-600"
                }`}
              >
                <Check className="size-4" />
              </button>
              <Input
                type="text"
                size="sm"
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1"
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove option ${i + 1}`}
                  onClick={() => removeOption(i)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={addOption}
            >
              <Plus className="size-4" />
              Add option
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-error-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : initial ? "Save" : "Add question"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
