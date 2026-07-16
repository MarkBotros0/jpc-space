"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  previewGroupImportAction,
  commitGroupImportAction,
} from "@/lib/group-import-actions";
import type { GroupImportPreview, GroupImportPreviewRow, GroupImportRowStatus } from "@/lib/group-import";

const STATUS_BADGE: Record<
  GroupImportRowStatus,
  { variant: "success" | "warning" | "error" | "outline"; label: string }
> = {
  assign: { variant: "success", label: "Assign" },
  unchanged: { variant: "outline", label: "Unchanged" },
  no_student: { variant: "error", label: "No match" },
  no_group: { variant: "warning", label: "No group" },
  invalid: { variant: "error", label: "Invalid" },
};

export function GroupImportForm({ seasonId }: { seasonId: number }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<GroupImportPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [done, setDone] = React.useState<number | null>(null);

  function onFilesChange(files: File[]) {
    setFile(files[0] ?? null);
    setPreview(null);
    setDone(null);
    setError(null);
  }

  async function runPreview() {
    if (!file) return;
    setPreviewing(true);
    setError(null);
    setDone(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await previewGroupImportAction(seasonId, formData);
    setPreviewing(false);
    if (!res.ok) {
      setPreview(null);
      setError(res.error);
      return;
    }
    setPreview(res.preview);
  }

  async function apply() {
    if (!preview) return;
    const assignments = preview.rows
      .filter((r) => r.status === "assign" && typeof r.studentUserId === "number" && typeof r.groupId === "number")
      .map((r) => ({ studentUserId: r.studentUserId as number, groupId: r.groupId as number }));
    if (assignments.length === 0) return;

    setApplying(true);
    setError(null);
    const res = await commitGroupImportAction({ seasonId, assignments });
    setApplying(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(res.assigned);
    setPreview(null);
    setFile(null);
    toast.success(`Assigned ${res.assigned} student${res.assigned === 1 ? "" : "s"}.`);
    router.refresh();
  }

  const columns: DataTableColumn<GroupImportPreviewRow>[] = [
    { key: "row", header: "Row", cell: (r) => <span className="tabular-nums text-muted-foreground">{r.rowNumber}</span> },
    { key: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email || "—"}</span> },
    { key: "group", header: "Group", cell: (r) => <span className="font-medium">{r.group || "—"}</span> },
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

  const assignCount = preview?.counts.assign ?? 0;

  if (done !== null) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg bg-success-50 px-4 py-3 dark:bg-success-950/40">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-600" />
          <div className="text-sm">
            <p className="font-semibold text-success-800 dark:text-success-200">Assignments applied</p>
            <p className="text-success-700 dark:text-success-300">
              {done} student{done === 1 ? "" : "s"} moved into their groups.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setDone(null)}>
            Import another file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <FileUpload accept=".csv,.xlsx" maxSizeMb={5} onFilesChange={onFilesChange} />
        <p className="text-xs text-muted-foreground">
          CSV or Excel with a header row. <code>email</code> and <code>group</code> are required;{" "}
          <code>name</code> is optional (for reference only).
        </p>
      </div>

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
            {preview.counts.total} rows ·{" "}
            <span className="font-medium text-success-700 dark:text-success-400">{preview.counts.assign} to assign</span> ·{" "}
            {preview.counts.unchanged} unchanged · {preview.counts.no_student} no match ·{" "}
            {preview.counts.no_group} no group · {preview.counts.invalid} invalid
          </p>
          <DataTable columns={columns} rows={preview.rows} rowKey={(r) => r.rowNumber} />
          <div className="flex justify-end">
            <Button onClick={apply} disabled={applying || assignCount === 0}>
              {applying
                ? "Applying…"
                : assignCount === 0
                  ? "Nothing to assign"
                  : `Apply ${assignCount} assignment${assignCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
