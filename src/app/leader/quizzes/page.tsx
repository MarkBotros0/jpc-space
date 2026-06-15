import Link from "next/link";
import { format } from "date-fns";
import { PenLine } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Quizzes" };

export default async function LeaderQuizzesPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["LEADER"]);

  const groups = user.groupLeaderIds.length
    ? await db.group.findMany({
        where: { id: { in: user.groupLeaderIds } },
        select: {
          id: true,
          seasonId: true,
          students: { select: { studentUserId: true } },
        },
      })
    : [];

  const seasonId = groups[0]?.seasonId ?? null;
  const studentIds = groups.flatMap((g) => g.students.map((s) => s.studentUserId));

  const quizzes = seasonId
    ? await db.quiz.findMany({
        where: { seasonId },
        orderBy: [{ session: { startsAt: "desc" } }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          maxScore: true,
          sessionId: true,
          session: { select: { title: true, startsAt: true } },
          grades: {
            where: { studentUserId: { in: studentIds } },
            select: { studentUserId: true, score: true },
          },
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Quizzes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Grade paper quizzes for your group</p>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No quizzes yet"
          description="Quizzes created by your admin will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {quizzes.map((q) => {
            const totalStudents = studentIds.length;
            const gradedCount = q.grades.filter((g) => g.score !== null).length;
            const fullyGraded = gradedCount >= totalStudents && totalStudents > 0;

            return (
              <Link
                key={q.id}
                href={q.sessionId ? `/leader/sessions/${q.sessionId}/quiz/${q.id}` : "#"}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-pop)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-brand-navy-900 dark:text-foreground">{q.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {q.session ? `${q.session.title} · ${format(q.session.startsAt, "MMM d, yyyy")}` : "No session"}
                    {" · "}Max {q.maxScore} pts
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {gradedCount}/{totalStudents} graded
                  </span>
                  {fullyGraded ? (
                    <Badge variant="success">Done</Badge>
                  ) : gradedCount > 0 ? (
                    <Badge variant="warning">Partial</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
