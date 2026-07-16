"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/rbac";

const jpcEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    date: z.coerce.date(),
    endDate: z.coerce.date().nullable(),
    url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    visibility: z.enum(["ALL", "ALUMNI_ONLY"]),
  })
  .refine((v) => !v.endDate || v.endDate.getTime() >= v.date.getTime(), {
    message: "End must be on or after the start.",
    path: ["endDate"],
  });

/**
 * Combine a date (yyyy-MM-dd) and optional time (HH:mm) into one datetime string.
 * A missing time means midnight (full-day).
 */
function combineDateTime(formData: FormData, dateKey: string, timeKey: string): string | null {
  const date = formData.get(dateKey);
  if (typeof date !== "string" || !date) return null;
  const time = formData.get(timeKey);
  const hhmm = typeof time === "string" && time ? time : "00:00";
  return `${date}T${hhmm}`;
}

export async function createJpcEventAction(formData: FormData) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  const parsed = jpcEventSchema.safeParse({
    title: formData.get("title"),
    date: combineDateTime(formData, "date", "time") ?? "",
    endDate: combineDateTime(formData, "endDate", "endTime"),
    url: formData.get("url"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db.jpcEvent.create({
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      endDate: parsed.data.endDate,
      url: parsed.data.url || null,
      visibility: parsed.data.visibility,
      createdById: user.userId,
    },
  });

  revalidatePath("/super/events");
  revalidatePath("/super/calendar");
  revalidatePath("/student/calendar");
  revalidatePath("/leader/calendar");
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function updateJpcEventAction(id: number, formData: FormData) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  const parsed = jpcEventSchema.safeParse({
    title: formData.get("title"),
    date: combineDateTime(formData, "date", "time") ?? "",
    endDate: combineDateTime(formData, "endDate", "endTime"),
    url: formData.get("url"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db.jpcEvent.update({
    where: { id },
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      endDate: parsed.data.endDate,
      url: parsed.data.url || null,
      visibility: parsed.data.visibility,
    },
  });

  revalidatePath("/super/events");
  revalidatePath("/super/calendar");
  revalidatePath("/student/calendar");
  revalidatePath("/leader/calendar");
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function deleteJpcEventAction(id: number) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  await db.jpcEvent.delete({ where: { id } });

  revalidatePath("/super/events");
  revalidatePath("/super/calendar");
  revalidatePath("/student/calendar");
  revalidatePath("/leader/calendar");
  revalidatePath("/admin/calendar");
  return { success: true };
}
