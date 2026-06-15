import { format } from "date-fns";
import { PenLine } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { listQuizResultsForStudent } from "@/lib/quiz-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";

export const metadata = { title: "Quizzes" };

export default async function StudentQuizzesPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const profile = await db.studentProfile.findUnique({
    where: { userId: user.userId },
    select: { activeSeasonId: true },
  });
  const seasonId = profile?.activeSeasonId ?? null;

  const results = seasonId
    ? await listQuizResultsForStudent(user.userId, seasonId)
    : [];

  const totalQuizzes = results.length;
  const gradedQuizzes = results.filter((r) => r.score !== null);
  const avgScore =
    gradedQuizzes.length > 0
      ? Math.round(
          gradedQuizzes.reduce((sum, r) => sum + (r.score! / r.maxScore) * 100, 0) /
            gradedQuizzes.length,
        )
      : null;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={avgScore ?? 0}
            label={avgScore !== null ? `Average quiz score ${avgScore}%` : "No graded quizzes yet"}
          >
            <span className="text-2xl font-black text-brand-navy-900 dark:text-foreground">
              {avgScore !== null ? `${avgScore}%` : "—"}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              avg
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700 dark:text-brand-teal-300">
              Quiz performance
            </p>
            <p className="mt-1 text-lg font-black text-brand-navy-900 dark:text-foreground">
              Average score
            </p>
            <p className="text-xs text-muted-foreground">
              {gradedQuizzes.length} graded · {totalQuizzes - gradedQuizzes.length} pending
            </p>
          </div>
        </div>
      </div>

      {/* Quiz list */}
      {results.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No quizzes yet"
          description="Your quiz results will appear here once graded."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((r) => {
            const pct = r.score !== null ? Math.round((r.score / r.maxScore) * 100) : null;
            return (
              <div
                key={r.quizId}
                className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-brand-navy-900 dark:text-foreground">{r.title}</p>
                    {r.sessionTitle && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.sessionTitle}
                        {r.sessionDate ? ` · ${format(r.sessionDate, "MMM d, yyyy")}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {r.score !== null ? (
                      <>
                        <p className="text-lg font-black text-brand-navy-900 dark:text-foreground">
                          {r.score}
                          <span className="text-sm font-normal text-muted-foreground">/{r.maxScore}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                      </>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
                {r.notes && (
                  <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {r.notes}
                  </p>
                )}
                {r.gradedAt && (
                  <p className="mt-2 text-[10px] text-muted-foreground/70">
                    Graded {format(r.gradedAt, "MMM d, yyyy")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
