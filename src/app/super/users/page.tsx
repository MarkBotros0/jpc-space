import Link from "next/link";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { UsersList } from "@/components/users/users-list";
import { SendPendingInvitesButton } from "@/components/users/invite-buttons";

export const metadata = { title: "Users" };

export default async function SuperUsersPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["SUPER"]);

  const users = await db.user.findMany({
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      deletedAt: true,
      passwordHash: true,
    },
  });

  const pendingInvites = await db.inviteToken.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    select: { userId: true },
  });
  const pendingSet = new Set(pendingInvites.map((p) => p.userId));

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    lastLoginAt: u.lastLoginAt,
    deletedAt: u.deletedAt,
    activated: u.passwordHash !== null || u.lastLoginAt !== null,
    invitePending: pendingSet.has(u.id),
  }));

  const needsInviteCount = rows.filter(
    (r) => !r.deletedAt && !r.activated && !r.invitePending,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-navy-900 dark:text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.filter((u) => !u.deletedAt).length} active · {users.length} total</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <SendPendingInvitesButton count={needsInviteCount} />
          <Button variant="outline" render={<Link href="/super/users/import" />}>Import profiles</Button>
          <Button render={<Link href="/super/users/new" />}>New user</Button>
        </div>
      </div>
      <UsersList rows={rows} />
    </div>
  );
}
