import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminOfSeason, isSuper } from "@/lib/rbac";
import { rejectApplication } from "@/lib/applications";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

const schema = z.object({ rejectionNote: z.string().optional() });

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const applicationId = parseInt(id, 10);
  if (isNaN(applicationId)) return new NextResponse("Bad request", { status: 400 });

  if (!isSuper(user)) {
    const application = await db.application.findUnique({
      where: { id: applicationId },
      select: { targetSeasonId: true },
    });
    if (!application) return new NextResponse("Not found", { status: 404 });
    if (!application.targetSeasonId || !isAdminOfSeason(user, application.targetSeasonId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const rejectionNote = parsed.success ? parsed.data.rejectionNote : undefined;

  try {
    await rejectApplication(applicationId, user.userId, rejectionNote);
    return NextResponse.json({ message: "rejected" }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
