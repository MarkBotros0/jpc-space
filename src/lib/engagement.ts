import { db } from "@/lib/db";

export interface EngagementScore {
  attendancePct: number;
  submissionPct: number;
  score: number; // 0-100
  attendanceTotal: number;
  attendancePresent: number;
  submissionsExpected: number;
  submissionsCompleted: number;
}

/**
 * Score = (attendance% × 0.5) + (submission% × 0.5).
 *
 * Attendance% = (PRESENT + LATE) / (sessions in past at season scope).
 * Submission% = (submissions with status SUBMITTED|REVIEWED|RETURNED) / (expected assignments).
 *
 * Pure query — recompute on read. Cheap at seed sizes; cache later if needed.
 */
export async function computeEngagementForStudent(
  studentUserId: number,
  seasonId: number,
): Promise<EngagementScore> {
  // Past sessions in this season.
  const now = new Date();
  const pastSessions = await db.session.findMany({
    where: { seasonId, startsAt: { lte: now } },
    select: { id: true },
  });
  const attendance = await db.attendance.findMany({
    where: {
      studentUserId,
      sessionId: { in: pastSessions.map((s) => s.id) },
    },
    select: { status: true },
  });
  const attendanceTotal = pastSessions.length;
  const attendancePresent = attendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE",
  ).length;
  const attendancePct =
    attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

  // Assignments targeted to this student in this season.
  const membership = await db.groupStudent.findUnique({
    where: { studentUserId },
    select: { groupId: true },
  });
  const assignments = await db.assignment.findMany({
    where: {
      seasonId,
      deletedAt: null,
      OR: [
        { isAllGroups: true },
        ...(membership ? [{ targets: { some: { groupId: membership.groupId } } }] : []),
      ],
    },
    select: {
      id: true,
      submissions: {
        where: { studentUserId },
        select: { status: true },
      },
    },
  });
  const submissionsExpected = assignments.length;
  const submissionsCompleted = assignments.filter((a) => {
    const s = a.submissions[0]?.status;
    return s === "SUBMITTED" || s === "REVIEWED" || s === "RETURNED";
  }).length;
  const submissionPct =
    submissionsExpected > 0
      ? Math.round((submissionsCompleted / submissionsExpected) * 100)
      : 0;

  const score = Math.round(attendancePct * 0.5 + submissionPct * 0.5);

  return {
    attendancePct,
    submissionPct,
    score,
    attendanceTotal,
    attendancePresent,
    submissionsExpected,
    submissionsCompleted,
  };
}

export async function computeEngagementBulk(
  studentUserIds: number[],
  seasonId: number,
): Promise<Map<number, EngagementScore>> {
  const out = new Map<number, EngagementScore>();
  for (const id of studentUserIds) {
    out.set(id, await computeEngagementForStudent(id, seasonId));
  }
  return out;
}

export interface AttendanceBudget {
  minutesUsed: number;
  budgetMinutes: number;
  budgetPct: number;
  absentCount: number;
  lateCount: number;
}

export async function computeAttendanceBudget(
  studentUserId: number,
  seasonId: number,
): Promise<AttendanceBudget | null> {
  const season = await db.season.findUnique({
    where: { id: seasonId },
    select: {
      absenceBudgetMinutes: true,
      absenceWeightMinutes: true,
      lateWeightMinutes: true,
    },
  });
  if (!season) return null;

  const [absentCount, lateCount] = await Promise.all([
    db.attendance.count({
      where: {
        studentUserId,
        status: "ABSENT",
        session: { seasonId },
      },
    }),
    db.attendance.count({
      where: {
        studentUserId,
        status: "LATE",
        session: { seasonId },
      },
    }),
  ]);

  const minutesUsed =
    absentCount * season.absenceWeightMinutes +
    lateCount * season.lateWeightMinutes;

  const budgetPct = Math.min(
    Math.round((minutesUsed / season.absenceBudgetMinutes) * 100),
    100,
  );

  return {
    minutesUsed,
    budgetMinutes: season.absenceBudgetMinutes,
    budgetPct,
    absentCount,
    lateCount,
  };
}

/**
 * Consecutive sessions attended (PRESENT or LATE) counting backwards from
 * the most recent past session. EXCUSED does not break or increment the streak.
 * ABSENT resets it. Sessions with no attendance record are skipped (not penalised).
 */
export async function computeAttendanceStreak(
  studentUserId: number,
  seasonId: number,
): Promise<number> {
  const sessions = await db.session.findMany({
    where: { seasonId, startsAt: { lte: new Date() } },
    orderBy: { startsAt: "desc" },
    select: {
      attendance: {
        where: { studentUserId },
        select: { status: true },
      },
    },
  });

  let streak = 0;
  for (const session of sessions) {
    const record = session.attendance[0];
    if (!record) continue; // no record — skip, don't break
    if (record.status === "ABSENT") break; // breaks streak
    if (record.status === "PRESENT" || record.status === "LATE") streak++;
    // EXCUSED: don't increment, don't break
  }
  return streak;
}
