"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuizAction } from "@/lib/quiz-actions";
import type { QuizKind } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  sessionId: number;
  seasonId: number;
  seasonCode: string;
  onCreated?: () => void;
}

export function CreateQuizForm({ sessionId, seasonId, seasonCode, onCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<QuizKind>("PAPER");
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setKind("PAPER");
    setTitle("");
    setMaxScore("100");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const score = parseInt(maxScore, 10);
    if (kind === "PAPER" && (isNaN(score) || score < 1)) {
      setError("Enter a valid max score.");
      return;
    }
    startTransition(async () => {
      const result = await createQuizAction({
        sessionId,
        seasonId,
        title: title.trim(),
        kind,
        maxScore: kind === "PAPER" ? score : undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
      onCreated?.();
      if (kind === "ONLINE" && result.quizId) {
        router.push(`/admin/season/${seasonCode}/quizzes/${result.quizId}/edit`);
      } else {
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add quiz
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      {/* Kind toggle */}
      <div className="flex gap-2">
        {(["PAPER", "ONLINE"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
              kind === k
                ? "border-brand-teal-600 bg-brand-teal-600/10 text-brand-teal-700 dark:text-brand-teal-300"
                : "border-border text-muted-foreground hover:border-brand-teal-500"
            }`}
          >
            {k === "PAPER" ? "Paper (enter grades)" : "Online (questions)"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <Input
            type="text"
            size="sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 3 Quiz"
            autoFocus
          />
        </div>
        {kind === "PAPER" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Max score</label>
            <Input
              type="number"
              size="sm"
              min={1}
              max={1000}
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="w-24"
            />
          </div>
        )}
      </div>

      {kind === "ONLINE" && (
        <p className="text-xs text-muted-foreground">
          You&apos;ll add questions and publish on the next screen.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Creating…" : kind === "ONLINE" ? "Create & add questions" : "Create"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          Cancel
        </Button>
      </div>

      {error && <p className="text-xs text-error-600">{error}</p>}
    </form>
  );
}
