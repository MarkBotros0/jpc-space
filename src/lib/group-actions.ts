"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { isAdminOfSeason } from "@/lib/rbac";
import { ForbiddenError } from "@/lib/auth/errors";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const groupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80),
  description: z.string().max(2000).optional().nullable(),
});

export interface GroupInput {
  name: string;
  description?: string | null;
  leaderIds: number[];
  studentIds: number[];
}

export async function createGroupAction(
  seasonId: number,
  input: GroupInput,
): Promise<ActionResult & { groupId?: number }> {
  const user = await getCurrentUserOrRedirect();
  if (!isAdminOfSeason(user, seasonId)) throw new ForbiddenError();

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    return zodErrors(parsed.error);
  }

  const group = await db.$transaction(async (tx) => {
    const g = await tx.group.create({
      data: {
        seasonId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      },
      select: { id: true },
    });
    if (input.leaderIds.length > 0) {
      await tx.groupLeader.createMany({
        data: input.leaderIds.map((userId) => ({ groupId: g.id, userId })),
        skipDuplicates: true,
      });
    }
    if (input.studentIds.length > 0) {
      // GroupStudent has studentUserId @unique — replace any existing membership first.
      await tx.groupStudent.deleteMany({
        where: { studentUserId: { in: input.studentIds } },
      });
      await tx.groupStudent.createMany({
        data: input.studentIds.map((studentUserId) => ({
          groupId: g.id,
          studentUserId,
        })),
      });
      await tx.seasonEnrollment.deleteMany({
        where: { seasonId, studentUserId: { in: input.studentIds } },
      });
      await tx.seasonEnrollment.createMany({
        data: input.studentIds.map((studentUserId) => ({
          seasonId,
          studentUserId,
          groupId: g.id,
        })),
      });
    }
    return g;
  });

  revalidatePath(`/admin/season`);
  revalidatePath(`/admin/groups`);
  revalidatePath(`/super/seasons`);
  return { ok: true, groupId: group.id };
}

export async function updateGroupAction(
  groupId: number,
  input: GroupInput,
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();
  const existing = await db.group.findUnique({
    where: { id: groupId },
    select: { seasonId: true },
  });
  if (!existing) return { ok: false, error: "Group not found." };
  if (!isAdminOfSeason(user, existing.seasonId)) throw new ForbiddenError();

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return zodErrors(parsed.error);

  await db.$transaction(async (tx) => {
    await tx.group.update({
      where: { id: groupId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      },
    });

    await tx.groupLeader.deleteMany({ where: { groupId } });
    if (input.leaderIds.length > 0) {
      await tx.groupLeader.createMany({
        data: input.leaderIds.map((userId) => ({ groupId, userId })),
        skipDuplicates: true,
      });
    }

    // Diff students: remove students no longer in the list, add new ones.
    const current = await tx.groupStudent.findMany({
      where: { groupId },
      select: { studentUserId: true },
    });
    const currentIds = new Set(current.map((c) => c.studentUserId));
    const nextIds = new Set(input.studentIds);

    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));
    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      await tx.groupStudent.deleteMany({
        where: { groupId, studentUserId: { in: toRemove } },
      });
    }
    if (toAdd.length > 0) {
      await tx.groupStudent.deleteMany({
        where: { studentUserId: { in: toAdd } },
      });
      await tx.groupStudent.createMany({
        data: toAdd.map((studentUserId) => ({ groupId, studentUserId })),
      });
      await tx.seasonEnrollment.deleteMany({
        where: { seasonId: existing.seasonId, studentUserId: { in: toAdd } },
      });
      await tx.seasonEnrollment.createMany({
        data: toAdd.map((studentUserId) => ({
          seasonId: existing.seasonId,
          studentUserId,
          groupId,
        })),
      });
    }
  });

  revalidatePath(`/admin/season`);
  revalidatePath(`/admin/groups`);
  return { ok: true };
}

export async function deleteGroupAction(groupId: number): Promise<void> {
  const user = await getCurrentUserOrRedirect();
  const existing = await db.group.findUnique({
    where: { id: groupId },
    select: { seasonId: true, season: { select: { code: true } } },
  });
  if (!existing) return;
  if (!isAdminOfSeason(user, existing.seasonId)) throw new ForbiddenError();

  await db.$transaction([
    db.groupLeader.deleteMany({ where: { groupId } }),
    db.groupStudent.deleteMany({ where: { groupId } }),
    db.seasonEnrollment.updateMany({
      where: { seasonId: existing.seasonId, groupId },
      data: { groupId: null },
    }),
    db.group.delete({ where: { id: groupId } }),
  ]);

  revalidatePath("/admin/groups");
  revalidatePath("/admin/season");
  redirect(`/admin/season/${existing.season.code}/groups`);
}

const assignSchema = z
  .array(
    z.object({
      studentUserId: z.number().int().positive(),
      groupId: z.number().int().positive().nullable(),
    }),
  )
  .max(2000);

export async function assignStudentsToGroupsAction(
  seasonId: number,
  assignments: { studentUserId: number; groupId: number | null }[],
): Promise<ActionResult> {
  const user = await getCurrentUserOrRedirect();
  if (!isAdminOfSeason(user, seasonId)) throw new ForbiddenError();

  const parsed = assignSchema.safeParse(assignments);
  if (!parsed.success) return { ok: false, error: "Invalid assignment data." };
  if (parsed.data.length === 0) return { ok: true };

  const groupIds = [
    ...new Set(parsed.data.map((a) => a.groupId).filter((g): g is number => g !== null)),
  ];
  const validGroups = new Set(
    (
      await db.group.findMany({ where: { id: { in: groupIds }, seasonId }, select: { id: true } })
    ).map((g) => g.id),
  );
  if (groupIds.some((id) => !validGroups.has(id))) {
    return { ok: false, error: "A selected group does not belong to this season." };
  }

  // Only students whose active season is this one may be assigned here.
  const validStudents = new Set(
    (
      await db.studentProfile.findMany({
        where: { activeSeasonId: seasonId, userId: { in: parsed.data.map((a) => a.studentUserId) } },
        select: { userId: true },
      })
    ).map((s) => s.userId),
  );

  await db.$transaction(
    async (tx) => {
      for (const a of parsed.data) {
        if (!validStudents.has(a.studentUserId)) continue;
        // GroupStudent.studentUserId is unique — a student is in one group at a time.
        await tx.groupStudent.deleteMany({ where: { studentUserId: a.studentUserId } });
        if (a.groupId !== null) {
          await tx.groupStudent.create({
            data: { groupId: a.groupId, studentUserId: a.studentUserId },
          });
        }
        await tx.seasonEnrollment.upsert({
          where: { studentUserId_seasonId: { studentUserId: a.studentUserId, seasonId } },
          update: { groupId: a.groupId },
          create: { studentUserId: a.studentUserId, seasonId, groupId: a.groupId },
        });
      }
    },
    { timeout: 20000 },
  );

  revalidatePath("/admin/season");
  return { ok: true };
}

function zodErrors(err: z.ZodError): { ok: false; error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}
