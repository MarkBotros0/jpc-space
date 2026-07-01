"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, X, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  submitVideoAnswerAction,
  saveVideoProgressAction,
} from "@/lib/video-quiz-actions";
import type { StudentVideoQuiz, StudentVideoQuestion } from "@/lib/video-quiz-query";
import { formatTimestamp } from "@/lib/video-time";

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  destroy(): void;
}

interface YTPlayerConstructorOptions {
  videoId: string;
  playerVars: Record<string, number>;
  events: {
    onReady: (event: { target: YTPlayer }) => void;
    onStateChange: (event: { data: number; target: YTPlayer }) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerConstructorOptions) => YTPlayer;
  PlayerState: { ENDED: number; PAUSED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

interface Answer {
  selectedIndex: number;
  isCorrect: boolean;
}

interface Props {
  sessionId: number;
  videoId: string;
  quiz: StudentVideoQuiz;
}

export function InteractiveVideoPlayer({ sessionId, videoId, quiz }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const furthestRef = useRef(quiz.furthestSeconds);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>(() => {
    const init: Record<number, Answer> = {};
    for (const q of quiz.questions) {
      if (q.answered && q.selectedIndex !== null && q.isCorrect !== null) {
        init[q.id] = { selectedIndex: q.selectedIndex, isCorrect: q.isCorrect };
      }
    }
    return init;
  });
  const [pending, setPending] = useState<StudentVideoQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ correctIndex: number; isCorrect: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(quiz.completedAt !== null);

  const questions = quiz.questions;

  // The earliest unanswered question's timestamp gates how far the student may
  // advance. Once all are answered, the whole video is watchable.
  const barrier = useMemo(() => {
    const unanswered = questions
      .filter((q) => !(q.id in answers))
      .map((q) => q.atSeconds);
    return unanswered.length > 0 ? Math.min(...unanswered) : Number.POSITIVE_INFINITY;
  }, [questions, answers]);
  const barrierRef = useRef(barrier);
  const pendingRef = useRef<StudentVideoQuestion | null>(null);
  useEffect(() => {
    barrierRef.current = barrier;
  }, [barrier]);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const allowedMax = barrier === Number.POSITIVE_INFINITY ? duration : barrier;

  const saveProgress = useCallback(
    (done: boolean) => {
      void saveVideoProgressAction(sessionId, Math.floor(furthestRef.current), done);
    },
    [sessionId],
  );

  // Create the player once the IFrame API is ready.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        playerVars: { controls: 0, fs: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
            const resumeTo = Math.min(furthestRef.current, barrierRef.current);
            if (resumeTo > 0) event.target.seekTo(resumeTo, true);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              furthestRef.current = event.target.getDuration();
              if (barrierRef.current === Number.POSITIVE_INFINITY) {
                setCompleted(true);
                saveProgress(true);
              }
            } else if (event.data === YT.PlayerState.PAUSED) {
              saveProgress(false);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      saveProgress(false);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, saveProgress]);

  // Poll playback: track time, enforce the barrier, trigger questions.
  useEffect(() => {
    pollRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || pendingRef.current) return;
      const t = player.getCurrentTime();
      setCurrentTime(t);
      if (t > furthestRef.current) furthestRef.current = t;

      const gate = barrierRef.current;
      if (gate === Number.POSITIVE_INFINITY) return;

      if (t >= gate - 0.1) {
        const q = questions.find((item) => item.atSeconds === gate && !(item.id in answers));
        if (q) {
          player.pauseVideo();
          player.seekTo(gate, true);
          setPending(q);
        }
      }
    }, 250);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [questions, answers]);

  // Persist progress if the student leaves the tab.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") saveProgress(false);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [saveProgress]);

  async function handleAnswer(selectedIndex: number) {
    if (!pending || submitting) return;
    setSubmitting(true);
    setAnswerError(null);
    const result = await submitVideoAnswerAction(pending.id, selectedIndex);
    setSubmitting(false);
    if (!result.ok) {
      setAnswerError(result.error);
      return;
    }
    setFeedback({ correctIndex: result.correctIndex, isCorrect: result.isCorrect });
    setAnswers((prev) => ({
      ...prev,
      [pending.id]: { selectedIndex, isCorrect: result.isCorrect },
    }));
  }

  function handleContinue() {
    setPending(null);
    setFeedback(null);
    playerRef.current?.playVideo();
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const player = playerRef.current;
    if (!player || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const target = Math.min(Math.max(0, fraction * duration), allowedMax);
    player.seekTo(target, true);
    setCurrentTime(target);
  }

  const earnedPoints = questions.reduce(
    (sum, q) => (answers[q.id]?.isCorrect ? sum + q.points : sum),
    0,
  );
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const answeredCount = questions.filter((q) => q.id in answers).length;
  const playedFraction = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const lockedFraction = duration > 0 && allowedMax < duration ? allowedMax / duration : 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-[var(--shadow-soft)]">
        <div className="relative aspect-video w-full">
          <div ref={mountRef} className="absolute inset-0 size-full" />
        </div>
        {/* Custom seek bar — the only way to scrub, so gating holds */}
        <div className="bg-black px-3 py-2">
          <div
            className="group relative h-6 cursor-pointer"
            onClick={handleSeek}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            tabIndex={0}
          >
            <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-white/20">
              {/* Locked-ahead region */}
              <div
                className="absolute inset-y-0 right-0 rounded-r-full bg-white/5"
                style={{ left: `${lockedFraction * 100}%` }}
              />
              {/* Played region */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-teal-500"
                style={{ width: `${playedFraction * 100}%` }}
              />
              {/* Question markers */}
              {duration > 0 &&
                questions.map((q) => (
                  <span
                    key={q.id}
                    className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                      q.id in answers ? "bg-success-500" : "bg-warning-400"
                    }`}
                    style={{ left: `${(q.atSeconds / duration) * 100}%` }}
                  />
                ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
            <span className="font-mono">
              {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
            </span>
            {allowedMax < duration && (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" />
                Answer to unlock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress summary */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold text-brand-navy-900 dark:text-foreground">
            {completed ? "Quiz complete" : "In progress"}
          </p>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-brand-teal-700 dark:text-brand-teal-300">
            {earnedPoints}
            <span className="text-sm font-semibold text-muted-foreground">/{totalPoints}</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Points
          </p>
        </div>
      </div>

      <QuestionModal
        pending={pending}
        feedback={feedback}
        submitting={submitting}
        error={answerError}
        onAnswer={handleAnswer}
        onContinue={handleContinue}
      />
    </div>
  );
}

interface ModalProps {
  pending: StudentVideoQuestion | null;
  feedback: { correctIndex: number; isCorrect: boolean } | null;
  submitting: boolean;
  error: string | null;
  onAnswer: (index: number) => void;
  onContinue: () => void;
}

function QuestionModal({
  pending,
  feedback,
  submitting,
  error,
  onAnswer,
  onContinue,
}: ModalProps) {
  return (
    <Modal open={pending !== null} onOpenChange={() => {}}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{pending?.prompt}</ModalTitle>
        </ModalHeader>
        {pending && (
          <div className="flex flex-col gap-2">
            {pending.options.map((option, i) => {
              const isCorrectOption = feedback?.correctIndex === i;
              const showState = feedback !== null;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={submitting || feedback !== null}
                  onClick={() => onAnswer(i)}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${
                    showState && isCorrectOption
                      ? "border-success-600 bg-success-600/10 text-success-700 dark:text-success-300"
                      : "border-border bg-card text-foreground hover:border-brand-teal-500 hover:bg-brand-teal-500/5"
                  }`}
                >
                  <span>{option}</span>
                  {showState && isCorrectOption && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
            {error && <p className="text-xs text-error-600">{error}</p>}
            {feedback && (
              <div className="mt-2 flex flex-col gap-3">
                <p
                  className={`inline-flex items-center gap-2 text-sm font-bold ${
                    feedback.isCorrect
                      ? "text-success-700 dark:text-success-300"
                      : "text-error-600"
                  }`}
                >
                  {feedback.isCorrect ? (
                    <>
                      <Check className="size-4" /> Correct!
                    </>
                  ) : (
                    <>
                      <X className="size-4" /> Not quite — the correct answer is highlighted.
                    </>
                  )}
                </p>
                <Button type="button" onClick={onContinue}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
