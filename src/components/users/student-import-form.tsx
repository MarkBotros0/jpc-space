"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";

import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  previewStudentImportAction,
  commitStudentImportAction,
} from "@/lib/student-import-actions";
import type {
  ImportPreview,
  ImportPreviewRow,
  ImportRowStatus,
  ImportCommitResult,
} from "@/lib/student-import";

interface SeasonOption {
  id: number;
  title: string;
  code: string;
}

interface StudentImportFormProps {
  seasons: SeasonOption[];
}

const STATUS_BADGE: Record<
  ImportRowStatus,
  { variant: "success" | "warning" | "error"; label: string }
> = {
  new: { variant: "success", label: "New" },
  exists: { variant: "warning", label: "Skip · exists" },
  duplicate: { variant: "warning", label: "Skip · duplicate" },
  invalid: { variant: "error", label: "Invalid" },
};

export function StudentImportForm({ seasons }: StudentImportFormProps) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [seasonId, setSeasonId] = React.useState<string>("");
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [committing, setCommitting] = React.useState(false);
  const [result, setResult] = React.useState<ImportCommitResult | null>(null);

  if (seasons.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No seasons yet"
        description="Create a season before importing students — every imported student is enrolled in one."
      />
    );
  }

  function onFilesChange(files: File[]) {
    setFile(files[0] ?? null);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  async function runPreview() {
    if (!file) return;
    setPreviewing(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await previewStudentImportAction(formData);
    setPreviewing(false);
    if (!res.ok) {
      setPreview(null);
      setError(res.error);
      return;
    }
    setPreview(res.preview);
  }

  async function runImport() {
    if (!preview || !seasonId) return;
    const rows = preview.rows
      .filter((r) => r.status === "new")
      .map((r) => ({ name: r.name, email: r.email }));
    if (rows.length === 0) return;

    setCommitting(true);
    setError(null);
    const res = await commitStudentImportAction({ seasonId: Number(seasonId), rows });
    setCommitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.result);
    setPreview(null);
    setFile(null);
    router.refresh();
  }

  const columns: DataTableColumn<ImportPreviewRow>[] = [
    { key: "row", header: "Row", cell: (r) => <span className="tabular-nums text-muted-foreground">{r.rowNumber}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name || "—"}</span> },
    { key: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email || "—"}</span> },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <Badge variant={STATUS_BADGE[r.status].variant} className="w-fit">
            {STATUS_BADGE[r.status].label}
          </Badge>
          {r.message ? <span className="text-xs text-muted-foreground">{r.message}</span> : null}
        </span>
      ),
    },
  ];

  const newCount = preview?.counts.new ?? 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg bg-success-50 px-4 py-3 dark:bg-success-950/40">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-600" />
            <div className="text-sm">
              <p className="font-semibold text-success-800 dark:text-success-200">Import complete</p>
              <p className="text-success-700 dark:text-success-300">
                {result.created} created · {result.skipped} skipped · {result.failed} failed
              </p>
            </div>
          </div>
          {result.rows.some((r) => r.outcome !== "created") ? (
            <ul className="flex flex-col gap-1 text-sm">
              {result.rows
                .filter((r) => r.outcome !== "created")
                .map((r) => (
                  <li key={r.email} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{r.email}</span> — {r.message}
                  </li>
                ))}
            </ul>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setResult(null)}>
              Import another file
            </Button>
            <Button onClick={() => router.push("/super/users")}>View users</Button>
          </div>
        </div>
      ) : (
        <>
          <FormField label="Season" required>
            <Select value={seasonId} onValueChange={(v) => setSeasonId(v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose the season to enroll students in" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Spreadsheet" required>
            <FileUpload accept=".csv,.xlsx" maxSizeMb={5} onFilesChange={onFilesChange} />
            <p className="mt-1 text-xs text-muted-foreground">
              CSV or Excel with a header row containing <code>name</code> and <code>email</code> columns.
            </p>
          </FormField>

          {error ? (
            <p className="rounded-md bg-error-50 px-3 py-2 text-sm text-error-800 dark:bg-error-950/40 dark:text-error-200">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button variant="outline" onClick={runPreview} disabled={!file || previewing}>
              {previewing ? "Reading…" : "Preview"}
            </Button>
          </div>

          {preview ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {preview.counts.total} rows · <span className="font-medium text-success-700 dark:text-success-400">{preview.counts.new} new</span> ·{" "}
                {preview.counts.exists} existing · {preview.counts.duplicate} duplicate · {preview.counts.invalid} invalid
              </p>
              <DataTable columns={columns} rows={preview.rows} rowKey={(r) => r.rowNumber} />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button onClick={runImport} disabled={committing || newCount === 0 || !seasonId}>
                  {committing
                    ? "Importing…"
                    : newCount === 0
                      ? "Nothing to import"
                      : `Import ${newCount} student${newCount === 1 ? "" : "s"}`}
                </Button>
              </div>
              {newCount > 0 && !seasonId ? (
                <p className="text-right text-xs text-error-600">Choose a season above first.</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
