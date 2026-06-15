"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";

interface ReviewActionsProps {
  applicationId: number;
}

export function ReviewActions({ applicationId }: ReviewActionsProps) {
  const router = useRouter();
  const [rejecting, setRejecting] = React.useState(false);
  const [rejectionNote, setRejectionNote] = React.useState("");
  const [approving, setApproving] = React.useState(false);
  const [rejectPending, setRejectPending] = React.useState(false);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to approve application.");
        return;
      }
      toast.success("Application approved. Invite sent to the applicant.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejectPending(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionNote: rejectionNote.trim() || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to reject application.");
        return;
      }
      toast.success("Application rejected.");
      setRejecting(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRejectPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleApprove}
          disabled={approving || rejectPending}
          className="gap-2 bg-success-600 text-white hover:bg-success-700"
        >
          <CheckCircle className="size-4" />
          {approving ? "Approving…" : "Approve"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setRejecting((v) => !v)}
          disabled={approving || rejectPending}
          className="gap-2"
        >
          <XCircle className="size-4" />
          {rejecting ? "Cancel" : "Reject"}
        </Button>
      </div>

      {rejecting && (
        <div className="space-y-3 rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-800/60 dark:bg-error-950/60">
          <FormField label="Rejection note (optional)">
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={3}
              placeholder="Provide a reason for the applicant…"
              className="bg-card"
            />
          </FormField>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectPending}
            className="w-full"
          >
            {rejectPending ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </div>
      )}
    </div>
  );
}
