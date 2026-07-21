import { NextResponse } from "next/server";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { isSuper, isMentor } from "@/lib/rbac";
import { buildSeasonExportWorkbook } from "@/lib/season-export";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(request: Request) {
  const user = await getCurrentUserOrRedirect();
  const url = new URL(request.url);
  const seasonIdParam = url.searchParams.get("season");

  const seasonId = Number(seasonIdParam);
  if (!seasonIdParam || !Number.isFinite(seasonId)) {
    return NextResponse.json({ error: "Invalid season." }, { status: 400 });
  }

  if (!isSuper(user) && !isMentor(user) && !user.seasonAdminIds.includes(seasonId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { buffer, seasonCode } = await buildSeasonExportWorkbook(seasonId);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${seasonCode}-attendance-grades.xlsx"`,
    },
  });
}
