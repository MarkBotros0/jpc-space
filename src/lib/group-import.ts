import { z } from "zod";

import { cellText, loadFirstWorksheet, SpreadsheetParseError } from "@/lib/spreadsheet";
import { listSeasonRoster, listGroupsForSelect } from "@/lib/groups-query";

export type GroupImportRowStatus = "assign" | "unchanged" | "no_student" | "no_group" | "invalid";

export interface GroupImportPreviewRow {
  rowNumber: number;
  name: string;
  email: string;
  group: string;
  status: GroupImportRowStatus;
  message?: string;
  studentUserId?: number;
  groupId?: number;
}

export interface GroupImportPreview {
  rows: GroupImportPreviewRow[];
  counts: {
    assign: number;
    unchanged: number;
    no_student: number;
    no_group: number;
    invalid: number;
    total: number;
  };
}

const emailSchema = z.string().trim().email();

export async function buildGroupImportPreview(
  buffer: Buffer,
  filename: string,
  seasonId: number,
): Promise<GroupImportPreview> {
  const sheet = await loadFirstWorksheet(buffer, filename);
  if (!sheet) throw new SpreadsheetParseError("Could not read any sheet from that file.");

  let nameCol = -1;
  let emailCol = -1;
  let groupCol = -1;
  sheet.getRow(1).eachCell((cell, col) => {
    const key = cellText(cell.value).trim().toLowerCase();
    if (key === "name") nameCol = col;
    else if (key === "email" || key === "e-mail") emailCol = col;
    else if (key === "group") groupCol = col;
  });
  if (emailCol === -1 || groupCol === -1) {
    throw new SpreadsheetParseError('The file needs a header row with "email" and "group" columns.');
  }

  const [roster, groups] = await Promise.all([
    listSeasonRoster(seasonId),
    listGroupsForSelect(seasonId),
  ]);
  const studentByEmail = new Map(roster.map((s) => [s.email.toLowerCase(), s]));
  const groupByName = new Map(groups.map((g) => [g.name.trim().toLowerCase(), g.id]));

  const rows: GroupImportPreviewRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = nameCol > 0 ? cellText(row.getCell(nameCol).value).trim() : "";
    const email = cellText(row.getCell(emailCol).value).trim();
    const group = cellText(row.getCell(groupCol).value).trim();
    if (!email && !group) continue;

    if (!emailSchema.safeParse(email).success) {
      rows.push({ rowNumber: r, name, email, group, status: "invalid", message: "Email is not valid." });
      continue;
    }
    const student = studentByEmail.get(email.toLowerCase());
    if (!student) {
      rows.push({
        rowNumber: r,
        name,
        email,
        group,
        status: "no_student",
        message: "No student with this email in this season.",
      });
      continue;
    }
    if (!group) {
      rows.push({ rowNumber: r, name, email, group, status: "no_group", message: "No group specified." });
      continue;
    }
    const groupId = groupByName.get(group.toLowerCase());
    if (groupId === undefined) {
      rows.push({
        rowNumber: r,
        name,
        email,
        group,
        status: "no_group",
        message: `No group named "${group}" in this season.`,
      });
      continue;
    }
    if (student.groupId === groupId) {
      rows.push({
        rowNumber: r,
        name,
        email,
        group,
        status: "unchanged",
        message: "Already in this group.",
        studentUserId: student.userId,
        groupId,
      });
      continue;
    }
    rows.push({ rowNumber: r, name, email, group, status: "assign", studentUserId: student.userId, groupId });
  }

  const counts = { assign: 0, unchanged: 0, no_student: 0, no_group: 0, invalid: 0, total: rows.length };
  for (const row of rows) counts[row.status]++;
  return { rows, counts };
}
