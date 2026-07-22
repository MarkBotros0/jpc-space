"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { getStorage, buildStorageKey } from "@/lib/storage";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/rbac";

const jpcEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    date: z.coerce.date(),
    endDate: z.coerce.date().nullable(),
    description: z.string().max(2000).optional().or(z.literal("")),
    url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    visibility: z.enum(["ALL", "ALUMNI_ONLY", "SEASON"]),
    seasonId: z.coerce.number().int().positive().nullable(),
  })
  .refine((v) => !v.endDate || v.endDate.getTime() >= v.date.getTime(), {
    message: "End must be on or after the start.",
    path: ["endDate"],
  })
  .refine((v) => v.visibility !== "SEASON" || v.seasonId != null, {
    message: "Choose a season for a season-only event.",
    path: ["seasonId"],
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

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Reads an optional "photo" upload; returns the stored path, an error, or null when none provided. */
async function readEventPhoto(
  formData: FormData,
): Promise<{ path: string } | { error: string } | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_IMAGE.includes(file.type)) return { error: "Photo must be JPEG, PNG, or WebP." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Photo must be under 5 MB." };
  const ext = file.type.split("/")[1] ?? "jpg";
  const key = buildStorageKey({
    bucket: "events",
    publicId: randomUUID(),
    originalName: `event.${ext}`,
  });
  const buffer = Buffer.from(await file.arrayBuffer());
  const { path } = await getStorage().put(key, buffer, { mime: file.type });
  return { path };
}

export async function createJpcEventAction(formData: FormData) {
  const user = await getCurrentUserOrRedirect();
  if (!canManageUsers(user)) throw new Error("Forbidden");

  const parsed = jpcEventSchema.safeParse({
    title: formData.get("title"),
    date: combineDateTime(formData, "date", "time") ?? "",
    endDate: combineDateTime(formData, "endDate", "endTime"),
    description: formData.get("description"),
    url: formData.get("url"),
    visibility: formData.get("visibility"),
    seasonId: formData.get("seasonId") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const photo = await readEventPhoto(formData);
  if (photo && "error" in photo) return { error: photo.error };

  await db.jpcEvent.create({
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      endDate: parsed.data.endDate,
      description: parsed.data.description || null,
      imagePath: photo && "path" in photo ? photo.path : null,
      url: parsed.data.url || null,
      visibility: parsed.data.visibility,
      seasonId: parsed.data.visibility === "SEASON" ? parsed.data.seasonId : null,
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
    description: formData.get("description"),
    url: formData.get("url"),
    visibility: formData.get("visibility"),
    seasonId: formData.get("seasonId") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const photo = await readEventPhoto(formData);
  if (photo && "error" in photo) return { error: photo.error };

  await db.jpcEvent.update({
    where: { id },
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      endDate: parsed.data.endDate,
      description: parsed.data.description || null,
      ...(photo && "path" in photo ? { imagePath: photo.path } : {}),
      url: parsed.data.url || null,
      visibility: parsed.data.visibility,
      seasonId: parsed.data.visibility === "SEASON" ? parsed.data.seasonId : null,
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
