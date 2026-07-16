"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sendInvitesAction, sendAllPendingInvitesAction } from "@/lib/invite-actions";

export function SendInviteButton({
  userId,
  label = "Send invite",
}: {
  userId: number;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function send() {
    startTransition(async () => {
      const res = await sendInvitesAction([userId]);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.sent > 0) toast.success("Invite sent.");
      else toast.message("No invite sent — this account may already be active.");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={send} disabled={pending}>
      {pending ? "Sending…" : label}
    </Button>
  );
}

export function SendPendingInvitesButton({ count }: { count: number }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (count === 0) return null;

  function send() {
    startTransition(async () => {
      const res = await sendAllPendingInvitesAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Invites sent: ${res.sent}${res.failed ? ` · ${res.failed} failed` : ""}`,
      );
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={send} disabled={pending}>
      {pending ? "Sending…" : `Send ${count} invite${count === 1 ? "" : "s"}`}
    </Button>
  );
}
