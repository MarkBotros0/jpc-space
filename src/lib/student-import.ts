import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { z } from "zod";

import { db } from "@/lib/db";
import { UserRole, EnrollmentStatus } from "@/generated/prisma/enums";

export class ImportParseError extends Error {}

export type ImportRowStatus = "new" | "exists" | "duplicate" | "invalid";

export interface ImportPreviewRow {
  rowNumber: number;
  name: string;
  email: string;
  status: ImportRowStatus;
  message?: string;
}

export interface ImportPreview {
  rows: ImportPreviewRow[];
  counts: { new: number; exists: number; duplicate: number; invalid: number; total: number };
}

const emailSchema = z.string().trim().email();
const rowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
});

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink.replace(/^mailto:/i, "");
    }
    if ("result" in value) return cellText((value as { result: ExcelJS.CellValue }).result);
    if ("richText" in value) {
      return (value as ExcelJS.CellRichTextValue).richText.map((part) => part.text).join("");
    }
  }
  return "";
}

async function loadWorksheet(buffer: Buffer, filename: string): Promise<ExcelJS.Worksheet | undefined> {
  const workbook = new ExcelJS.Workbook();
  if (filename.toLowerCase().endsWith(".csv")) {
    return workbook.csv.read(Readable.from([buffer]));
  }
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook.worksheets[0];
}

export async function buildImportPreview(buffer: Buffer, filename: string): Promise<ImportPreview> {
  const sheet = await loadWorksheet(buffer, filename);
  if (!sheet) throw new ImportParseError("Could not read any sheet from that file.");

  let nameCol = -1;
  let emailCol = -1;
  sheet.getRow(1).eachCell((cell, col) => {
    const key = cellText(cell.value).trim().toLowerCase();
    if (key === "name") nameCol = col;
    else if (key === "email") emailCol = col;
  });
  if (nameCol === -1 || emailCol === -1) {
    throw new ImportParseError('The file needs a header row with "name" and "email" columns.');
  }

  const rows: ImportPreviewRow[] = [];
  const seen = new Set<string>();
  const candidates = new Set<string>();

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = cellText(row.getCell(nameCol).value).trim();
    const email = cellText(row.getCell(emailCol).value).trim();
    if (!name && !email) continue; // blank row

    if (name.length < 2 || !emailSchema.safeParse(email).success) {
      rows.push({
        rowNumber: r,
        name,
        email,
        status: "invalid",
        message: name.length < 2 ? "Name is missing or too short." : "Email is not valid.",
      });
      continue;
    }
    if (seen.has(email)) {
      rows.push({ rowNumber: r, name, email, status: "duplicate", message: "Repeated earlier in this file." });
      continue;
    }
    seen.add(email);
    candidates.add(email);
    rows.push({ rowNumber: r, name, email, status: "new" });
  }

  if (candidates.size > 0) {
    const existing = await db.user.findMany({
      where: { email: { in: [...candidates] } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((u) => u.email));
    for (const row of rows) {
      if (row.status === "new" && existingSet.has(row.email)) {
        row.status = "exists";
        row.message = "Already in the system.";
      }
    }
  }

  const counts = { new: 0, exists: 0, duplicate: 0, invalid: 0, total: rows.length };
  for (const row of rows) counts[row.status]++;
  return { rows, counts };
}

export interface ImportCommitRow {
  name: string;
  email: string;
}

export type CommitOutcome = "created" | "skipped" | "failed";

export interface CommitResultRow {
  name: string;
  email: string;
  outcome: CommitOutcome;
  message?: string;
  userId?: number;
}

export interface ImportCommitResult {
  created: number;
  skipped: number;
  failed: number;
  rows: CommitResultRow[];
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  );
}

export async function commitStudentImport(
  input: ImportCommitRow[],
  seasonId: number,
): Promise<ImportCommitResult> {
  const rows: CommitResultRow[] = [];

  for (const item of input) {
    const parsed = rowSchema.safeParse(item);
    if (!parsed.success) {
      rows.push({ name: item.name, email: item.email, outcome: "failed", message: "Invalid name or email." });
      continue;
    }
    const { name, email } = parsed.data;

    try {
      const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        rows.push({ name, email, outcome: "skipped", message: "Already in the system." });
        continue;
      }

      const created = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            role: UserRole.STUDENT,
            passwordHash: null,
            studentProfile: { create: { activeSeasonId: seasonId } },
          },
          select: { id: true },
        });
        await tx.seasonEnrollment.create({
          data: { studentUserId: user.id, seasonId, status: EnrollmentStatus.ACTIVE },
        });
        return user;
      });

      rows.push({ name, email, outcome: "created", userId: created.id });
    } catch (err) {
      if (isUniqueViolation(err)) {
        rows.push({ name, email, outcome: "skipped", message: "Already in the system." });
      } else {
        console.error(`[student-import] failed for ${email}:`, err);
        rows.push({ name, email, outcome: "failed", message: "Could not create this account." });
      }
    }
  }

  return {
    created: rows.filter((r) => r.outcome === "created").length,
    skipped: rows.filter((r) => r.outcome === "skipped").length,
    failed: rows.filter((r) => r.outcome === "failed").length,
    rows,
  };
}
