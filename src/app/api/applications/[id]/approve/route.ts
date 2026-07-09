import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminOfSeason, isSuper } from "@/lib/rbac";
import { approveApplication } from "@/lib/applications";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

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

  try {
    const { userId } = await approveApplication(applicationId, user.userId);
    return NextResponse.json({ userId }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
