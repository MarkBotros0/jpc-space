import { db } from "@/lib/db";
import { getStorage, buildStorageKey } from "@/lib/storage";
import { createInvite } from "@/lib/invites";
import { sendRejectionEmail } from "@/lib/email";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import type { Application } from "@/generated/prisma/client";

export type { Application };

export interface ApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  university: string;
  yearOfStudy: string;
  spiritualBackground: string;
  whyJoin: string;
  howHeard: string;
}

export async function createApplication(
  data: ApplicationInput,
  photoFile?: File,
): Promise<Application> {
  let photoPath: string | undefined;

  if (photoFile) {
    const storage = getStorage();
    const key = buildStorageKey({
      bucket: "applications",
      publicId: `${Date.now()}`,
      originalName: photoFile.name,
    });
    const bytes = await photoFile.arrayBuffer();
    const result = await storage.put(key, Buffer.from(bytes), {
      mime: photoFile.type,
    });
    photoPath = result.path;
  }

  return db.application.create({
    data: { ...data, ...(photoPath ? { photoPath } : {}) },
  });
}

export async function approveApplication(
  applicationId: number,
  reviewerId: number,
): Promise<{ userId: number }> {
  const application = await db.application.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new Error("Application not found");
  if (application.status !== "PENDING") throw new Error("Application is not pending");

  // Use targetSeasonId if set, otherwise find the active The Way season
  let seasonId = application.targetSeasonId;
  if (!seasonId) {
    const season = await db.season.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { title: { contains: "The Way", mode: "insensitive" } },
          { code: { contains: "the-way", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    if (season) seasonId = season.id;
  }

  const { userId } = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: application.fullName,
        email: application.email,
        role: "STUDENT",
      },
    });

    await tx.studentProfile.create({ data: { userId: newUser.id } });

    if (seasonId) {
      await tx.seasonEnrollment.create({
        data: { studentUserId: newUser.id, seasonId, status: "ACTIVE" },
      });
    }

    await tx.application.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return { userId: newUser.id };
  });

  // Send invite outside the transaction so an email failure doesn't roll back the DB changes
  try {
    await createInvite(userId, reviewerId);
  } catch (err) {
    console.error("[applications] createInvite failed after approval:", err);
  }

  return { userId };
}

export async function rejectApplication(
  applicationId: number,
  reviewerId: number,
  rejectionNote?: string,
): Promise<void> {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { email: true, fullName: true, status: true },
  });
  if (!application) throw new Error("Application not found");
  if (application.status !== "PENDING") throw new Error("Application is not pending");

  await db.application.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      ...(rejectionNote ? { rejectionNote } : {}),
    },
  });

  if (process.env.SEND_REJECTION_EMAILS === "true") {
    try {
      await sendRejectionEmail(application.email, application.fullName, rejectionNote);
    } catch (err) {
      console.error("[applications] sendRejectionEmail failed:", err);
    }
  }
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  seasonId?: number;
}

export async function listApplications(filters: ApplicationFilters): Promise<Application[]> {
  return db.application.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.seasonId !== undefined ? { targetSeasonId: filters.seasonId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}
