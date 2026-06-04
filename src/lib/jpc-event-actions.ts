"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/rbac";

const jpcEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  date: z.coerce.date(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  visibility: z.enum(["ALL", "ALUMNI_ONLY"]),
});

export async function createJpcEventAction(formData: FormData) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  const parsed = jpcEventSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    url: formData.get("url"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db.jpcEvent.create({
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      url: parsed.data.url || null,
      visibility: parsed.data.visibility,
      createdById: user.userId,
    },
  });

  revalidatePath("/super/events");
  revalidatePath("/super/calendar");
  return { success: true };
}

export async function updateJpcEventAction(id: number, formData: FormData) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  const parsed = jpcEventSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    url: formData.get("url"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db.jpcEvent.update({
    where: { id },
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      url: parsed.data.url || null,
      visibility: parsed.data.visibility,
    },
  });

  revalidatePath("/super/events");
  revalidatePath("/super/calendar");
  return { success: true };
}

export async function deleteJpcEventAction(id: number) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  await db.jpcEvent.delete({ where: { id } });

  revalidatePath("/super/events");
  revalidatePath("/super/calendar");
  return { success: true };
}
