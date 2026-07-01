"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createVideoQuestionAction,
  updateVideoQuestionAction,
  deleteVideoQuestionAction,
  type VideoQuestionInput,
} from "@/lib/video-quiz-actions";
import type { VideoQuestionAdmin } from "@/lib/video-quiz-query";
import { formatTimestamp, parseTimestamp } from "@/lib/video-time";

interface Props {
  sessionId: number;
  questions: VideoQuestionAdmin[];
}

export function VideoQuestionsEditor({ sessionId, questions }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (deleteId === null) return;
    startTransition(async () => {
      await deleteVideoQuestionAction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 && !adding ? (
        <EmptyState
          title="No questions yet"
          description="Add timed multiple-choice questions that pause the video for students."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {questions.map((q) =>
            editingId === q.id ? (
              <li key={q.id}>
                <QuestionForm
                  sessionId={sessionId}
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
                    <span className="rounded-md bg-brand-teal-600/10 px-1.5 py-0.5 font-mono text-xs font-bold text-brand-teal-700 dark:text-brand-teal-300">
                      {formatTimestamp(q.atSeconds)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {q.points} pt{q.points === 1 ? "" : "s"} · {q.responseCount} answered
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-brand-navy-900 dark:text-foreground">
                    {q.prompt}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Correct: {q.options[q.correctIndex]}
                  </p>
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
          sessionId={sessionId}
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
  sessionId: number;
  initial?: VideoQuestionAdmin;
  onDone: () => void;
  onCancel: () => void;
}

function QuestionForm({ sessionId, initial, onDone, onCancel }: FormProps) {
  const [timestamp, setTimestamp] = useState(
    initial ? formatTimestamp(initial.atSeconds) : "",
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [points, setPoints] = useState(String(initial?.points ?? 1));
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

    const atSeconds = parseTimestamp(timestamp);
    if (atSeconds === null) {
      setError("Enter a valid timestamp like 1:30.");
      return;
    }
    const trimmedOptions = options.map((o) => o.trim());
    if (trimmedOptions.some((o) => o.length === 0)) {
      setError("Every option needs text.");
      return;
    }
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts < 1) {
      setError("Points must be at least 1.");
      return;
    }

    const input: VideoQuestionInput = {
      atSeconds,
      prompt: prompt.trim(),
      options: trimmedOptions,
      correctIndex,
      points: pts,
    };

    startTransition(async () => {
      const result = initial
        ? await updateVideoQuestionAction(initial.id, input)
        : await createVideoQuestionAction(sessionId, input);
      if (!result.ok) {
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
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground">Timestamp</label>
          <Input
            type="text"
            size="sm"
            inputMode="numeric"
            placeholder="1:30"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-24"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground">Points</label>
          <Input
            type="number"
            size="sm"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-20"
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
