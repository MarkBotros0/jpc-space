"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { isSuper } from "@/lib/rbac";
import { ForbiddenError } from "@/lib/auth/errors";
import { createInvite } from "@/lib/invites";

export type SendInvitesResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: string };

async function issueInvites(
  userIds: number[],
  invitedById: number,
): Promise<{ sent: number; failed: number }> {
  // Only non-deleted, not-yet-activated accounts can be invited.
  const users = await db.user.findMany({
    where: { id: { in: userIds }, deletedAt: null, passwordHash: null, lastLoginAt: null },
    select: { id: true },
  });
  let sent = 0;
  let failed = 0;
  for (const u of users) {
    try {
      await createInvite(u.id, invitedById);
      sent++;
    } catch (err) {
      console.error(`[invites] failed to issue invite for user ${u.id}:`, err);
      failed++;
    }
  }
  return { sent, failed };
}

const idsSchema = z.array(z.number().int().positive()).min(1).max(5000);

export async function sendInvitesAction(userIds: number[]): Promise<SendInvitesResult> {
  const user = await getCurrentUserOrRedirect();
  if (!isSuper(user)) throw new ForbiddenError();

  const parsed = idsSchema.safeParse(userIds);
  if (!parsed.success) return { ok: false, error: "No valid recipients." };

  const { sent, failed } = await issueInvites(parsed.data, user.userId);
  revalidatePath("/super/users");
  return { ok: true, sent, failed };
}

export async function sendAllPendingInvitesAction(): Promise<SendInvitesResult> {
  const user = await getCurrentUserOrRedirect();
  if (!isSuper(user)) throw new ForbiddenError();

  const now = new Date();
  const pending = await db.user.findMany({
    where: {
      deletedAt: null,
      passwordHash: null,
      lastLoginAt: null,
      invitesReceived: { none: { usedAt: null, expiresAt: { gt: now } } },
    },
    select: { id: true },
  });
  if (pending.length === 0) return { ok: true, sent: 0, failed: 0 };

  const { sent, failed } = await issueInvites(
    pending.map((p) => p.id),
    user.userId,
  );
  revalidatePath("/super/users");
  return { ok: true, sent, failed };
}
