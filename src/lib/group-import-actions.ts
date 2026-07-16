"use server";

import { z } from "zod";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { isAdminOfSeason } from "@/lib/rbac";
import { ForbiddenError } from "@/lib/auth/errors";
import { SpreadsheetParseError } from "@/lib/spreadsheet";
import { buildGroupImportPreview, type GroupImportPreview } from "@/lib/group-import";
import { assignStudentsToGroupsAction } from "@/lib/group-actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = [".csv", ".xlsx"];

export type GroupPreviewActionResult =
  | { ok: true; preview: GroupImportPreview }
  | { ok: false; error: string };

export async function previewGroupImportAction(
  seasonId: number,
  formData: FormData,
): Promise<GroupPreviewActionResult> {
  const user = await getCurrentUserOrRedirect();
  if (!isAdminOfSeason(user, seasonId)) throw new ForbiddenError();

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file provided." };
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
    return { ok: false, error: "File must be a .csv or .xlsx." };
  }
  if (file.size > MAX_BYTES) return { ok: false, error: "File must be under 5 MB." };

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const preview = await buildGroupImportPreview(buffer, file.name, seasonId);
    return { ok: true, preview };
  } catch (err) {
    if (err instanceof SpreadsheetParseError) return { ok: false, error: err.message };
    console.error("[group-import] preview failed:", err);
    return { ok: false, error: "Could not read that file. Make sure it is a valid CSV or Excel sheet." };
  }
}

const commitSchema = z.object({
  seasonId: z.number().int().positive(),
  assignments: z
    .array(z.object({ studentUserId: z.number().int().positive(), groupId: z.number().int().positive() }))
    .min(1)
    .max(2000),
});

export type GroupCommitActionResult = { ok: true; assigned: number } | { ok: false; error: string };

export async function commitGroupImportAction(
  input: z.infer<typeof commitSchema>,
): Promise<GroupCommitActionResult> {
  const user = await getCurrentUserOrRedirect();
  if (!isAdminOfSeason(user, input.seasonId)) throw new ForbiddenError();

  const parsed = commitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const res = await assignStudentsToGroupsAction(parsed.data.seasonId, parsed.data.assignments);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, assigned: parsed.data.assignments.length };
}
