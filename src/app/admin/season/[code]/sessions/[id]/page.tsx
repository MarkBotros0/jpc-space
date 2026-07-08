import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { MapPin, QrCode, RotateCcw } from "lucide-react";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole, canEditSeason } from "@/lib/auth/permissions";
import { loadSeasonByCode } from "@/lib/seasons-query";
import { loadSessionById } from "@/lib/sessions-query";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@/generated/prisma/enums";
import {
  openCheckInAction,
  closeCheckInAction,
  regenerateCheckInTokenAction,
} from "@/lib/session-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckInQr } from "@/components/sessions/check-in-qr";
import { CheckInAttendanceList } from "@/components/sessions/check-in-attendance-list";
import { CreateQuizForm } from "@/components/quizzes/create-quiz-form";
import { listQuizzesForSession } from "@/lib/quiz-query";
import { VideoQuestionsEditor } from "@/components/sessions/video-questions-editor";
import { listVideoQuestions } from "@/lib/video-quiz-query";

interface PageProps {
  params: Promise<{ code: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Session #${id}` };
}

export default async function SessionDetailPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["ADMIN", "SUPER"]);
  const { code, id } = await params;
  const season = await loadSeasonByCode(code);
  if (!canEditSeason(user, season.id)) redirect("/admin/season");

  const session = await loadSessionById(Number(id));
  if (session.seasonId !== season.id) redirect(`/admin/season/${season.code}/calendar`);

  const CHECK_IN_DURATION_MS = 3 * 60 * 60 * 1000;
  // eslint-disable-next-line react-hooks/purity -- Server Component: Date.now() runs once per request
  const now = Date.now();
  const checkInOpen =
    !!session.checkInOpenAt &&
    !session.checkInClosedAt &&
    now - session.checkInOpenAt.getTime() < CHECK_IN_DURATION_MS;
  const checkInExpiresAt =
    session.checkInOpenAt && checkInOpen
      ? new Date(session.checkInOpenAt.getTime() + CHECK_IN_DURATION_MS)
      : null;
  const checkInUrl = session.checkInToken
    ? `${process.env.AUTH_URL}/checkin/${session.checkInToken}`
    : null;

  const quizzes = await listQuizzesForSession(session.id);
  const videoQuestions = await listVideoQuestions(session.id);

  const enrollments = await db.seasonEnrollment.findMany({
    where: { seasonId: season.id, status: "ACTIVE" },
    select: {
      studentUser: {
        select: {
          id: true,
          name: true,
          attendanceRecords: {
            where: { sessionId: session.id },
            select: { status: true, checkedInAt: true },
          },
        },
      },
    },
    orderBy: { studentUser: { name: "asc" } },
  });

  const studentRows = enrollments.map((e) => ({
    userId: e.studentUser.id,
    name: e.studentUser.name ?? "",
    checkedInAt: e.studentUser.attendanceRecords[0]?.checkedInAt ?? null,
    status: (e.studentUser.attendanceRecords[0]?.status ?? null) as AttendanceStatus | null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">{session.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{`${format(session.startsAt, "EEE, MMM d, yyyy · h:mm a")} · ${session.durationMinutes} min`}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link
                href={`/admin/season/${season.code}/sessions/${session.id}/edit`}
              />
            }
          >
            Edit
          </Button>
          <Button
            render={
              <Link
                href={`/admin/season/${season.code}/sessions/${session.id}/attendance`}
              />
            }
          >
            Mark attendance
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          {session.recurrenceGroupId && (
            <Badge variant="outline" className="self-start">
              Part of a recurring series
            </Badge>
          )}
          {session.location && (
            <p className="inline-flex items-center gap-1.5 text-sm">
              <MapPin className="size-4 text-muted-foreground" />
              {session.location}
            </p>
          )}
          {session.description && (
            <p className="whitespace-pre-line text-sm text-foreground">
              {session.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quizzes */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Quizzes</CardTitle>
          <CreateQuizForm
            sessionId={session.id}
            seasonId={season.id}
            seasonCode={season.code}
          />
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes for this session yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {quizzes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-brand-navy-900 dark:text-foreground">{q.title}</p>
                      <Badge variant={q.kind === "ONLINE" ? "teal" : "outline"}>
                        {q.kind === "ONLINE" ? "Online" : "Paper"}
                      </Badge>
                      {q.kind === "ONLINE" && (
                        <Badge variant={q.publishedAt ? "outline" : "warning"}>
                          {q.publishedAt ? "Published" : "Draft"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {q.kind === "ONLINE"
                        ? `${q.questionCount} question${q.questionCount === 1 ? "" : "s"} · ${q.maxScore} pts`
                        : `Max score: ${q.maxScore} · ${q.gradedCount} graded`}
                    </p>
                  </div>
                  {q.kind === "ONLINE" && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/admin/season/${season.code}/quizzes/${q.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/admin/season/${season.code}/quizzes/${q.id}/grade`} />}
                      >
                        Grade
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Interactive video questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Video questions</CardTitle>
        </CardHeader>
        <CardContent>
          {session.youtubeUrl ? (
            <VideoQuestionsEditor sessionId={session.id} questions={videoQuestions} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Add a video URL to this session (via Edit) to place timed questions.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="size-4" />
            Check-in
          </CardTitle>
          <div className="flex items-center gap-2">
            <form
              action={async () => {
                "use server";
                await regenerateCheckInTokenAction(session.id);
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                <RotateCcw className="size-4" />
                Regenerate QR
              </Button>
            </form>
            {checkInOpen ? (
              <form
                action={async () => {
                  "use server";
                  await closeCheckInAction(session.id);
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Close check-in
                </Button>
              </form>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await openCheckInAction(session.id);
                }}
              >
                <Button type="submit" size="sm">
                  Open check-in
                </Button>
              </form>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {checkInOpen && checkInExpiresAt && (
            <p className="text-xs text-muted-foreground">
              Closes at {format(checkInExpiresAt, "h:mm a")}
            </p>
          )}
          {checkInOpen && checkInUrl && (
            <CheckInQr url={checkInUrl} sessionId={session.id} />
          )}
          <CheckInAttendanceList
            sessionId={session.id}
            students={studentRows}
            isOpen={checkInOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
