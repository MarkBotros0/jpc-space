import ExcelJS from "exceljs";
import { format } from "date-fns";

import { db } from "@/lib/db";
import type { AttendanceStatus, SubmissionStatus } from "@/generated/prisma/enums";

// Attendance cell text. LATE renders as the number of minutes late (e.g. 5);
// when the minutes weren't recorded it falls back to "L".
function attendanceCell(status: AttendanceStatus, lateMinutes: number | null): string | number {
  if (status === "PRESENT") return "P";
  if (status === "ABSENT") return "A";
  return lateMinutes ?? "L";
}

const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  RETURNED: "Returned",
};
const TURNED_IN: SubmissionStatus[] = ["SUBMITTED", "REVIEWED", "RETURNED"];

const HEADER_FILL = "FF0B2447"; // brand-navy-900

interface StudentRow {
  studentUserId: number;
  name: string;
  email: string;
  groupName: string;
}

function styleHeader(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { vertical: "middle" };
}

function freezeFirstRowAndColumns(sheet: ExcelJS.Worksheet, xSplit: number): void {
  sheet.views = [{ state: "frozen", xSplit, ySplit: 1 }];
}

export async function buildSeasonExportWorkbook(seasonId: number): Promise<{
  buffer: Buffer;
  seasonCode: string;
}> {
  const season = await db.season.findUniqueOrThrow({
    where: { id: seasonId },
    select: { code: true, title: true },
  });

  const enrollments = await db.seasonEnrollment.findMany({
    where: { seasonId, status: "ACTIVE" },
    select: {
      studentUserId: true,
      studentUser: { select: { name: true, email: true } },
      group: { select: { name: true } },
    },
  });
  const students: StudentRow[] = enrollments
    .map((e) => ({
      studentUserId: e.studentUserId,
      name: e.studentUser.name,
      email: e.studentUser.email,
      groupName: e.group?.name ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sessions = await db.session.findMany({
    where: { seasonId, startsAt: { lte: new Date() } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      attendance: { select: { studentUserId: true, status: true, lateMinutes: true } },
    },
  });

  const quizzes = await db.quiz.findMany({
    where: { seasonId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      maxScore: true,
      grades: { select: { studentUserId: true, score: true } },
    },
  });

  const assignments = await db.assignment.findMany({
    where: { seasonId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      submissions: { select: { studentUserId: true, status: true } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JPC Space";
  workbook.created = new Date();

  // --- Attendance tab -------------------------------------------------------
  const attendance = workbook.addWorksheet("Attendance");
  const attHeader = ["Student", "Email", "Group", ...sessions.map((s) => `${format(s.startsAt, "MMM d")} · ${s.title}`), "Attendance %"];
  attendance.addRow(attHeader);
  attendance.columns = attHeader.map((_, i) => ({ width: i < 3 ? (i === 1 ? 28 : 22) : 16 }));

  const attendanceBySession = sessions.map(
    (s) => new Map(s.attendance.map((a) => [a.studentUserId, a])),
  );

  for (const student of students) {
    let presentCount = 0;
    const cells = sessions.map((_, i) => {
      const record = attendanceBySession[i].get(student.studentUserId);
      if (!record) return "";
      if (record.status === "PRESENT" || record.status === "LATE") presentCount += 1;
      return attendanceCell(record.status, record.lateMinutes);
    });
    const pct = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0;
    attendance.addRow([student.name, student.email, student.groupName, ...cells, pct]);
  }
  styleHeader(attendance.getRow(1));
  freezeFirstRowAndColumns(attendance, 3);

  // --- Grades tab -----------------------------------------------------------
  const grades = workbook.addWorksheet("Grades");
  const gradeHeader = ["Student", "Email", "Group", ...quizzes.map((q) => `${q.title} (/${q.maxScore})`), "Average %"];
  grades.addRow(gradeHeader);
  grades.columns = gradeHeader.map((_, i) => ({ width: i < 3 ? (i === 1 ? 28 : 22) : 18 }));

  const scoreByQuiz = quizzes.map(
    (q) => new Map(q.grades.map((g) => [g.studentUserId, g.score])),
  );

  for (const student of students) {
    let pctSum = 0;
    let gradedCount = 0;
    const cells = quizzes.map((q, i) => {
      const score = scoreByQuiz[i].get(student.studentUserId);
      if (score === null || score === undefined) return "";
      if (q.maxScore > 0) {
        pctSum += (score / q.maxScore) * 100;
        gradedCount += 1;
      }
      return score;
    });
    const avg = gradedCount > 0 ? Math.round(pctSum / gradedCount) : "";
    grades.addRow([student.name, student.email, student.groupName, ...cells, avg]);
  }
  styleHeader(grades.getRow(1));
  freezeFirstRowAndColumns(grades, 3);

  // --- Assignments tab ------------------------------------------------------
  const assignmentSheet = workbook.addWorksheet("Assignments");
  const assignmentHeader = ["Student", "Email", "Group", ...assignments.map((a) => a.title), "Submitted %"];
  assignmentSheet.addRow(assignmentHeader);
  assignmentSheet.columns = assignmentHeader.map((_, i) => ({ width: i < 3 ? (i === 1 ? 28 : 22) : 20 }));

  const statusByAssignment = assignments.map(
    (a) => new Map(a.submissions.map((s) => [s.studentUserId, s.status])),
  );

  for (const student of students) {
    let turnedIn = 0;
    const cells = assignments.map((_, i) => {
      const status = statusByAssignment[i].get(student.studentUserId);
      if (!status) return "—";
      if (TURNED_IN.includes(status)) turnedIn += 1;
      return SUBMISSION_LABEL[status];
    });
    const pct = assignments.length > 0 ? Math.round((turnedIn / assignments.length) * 100) : 0;
    assignmentSheet.addRow([student.name, student.email, student.groupName, ...cells, pct]);
  }
  styleHeader(assignmentSheet.getRow(1));
  freezeFirstRowAndColumns(assignmentSheet, 3);

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { buffer, seasonCode: season.code };
}
