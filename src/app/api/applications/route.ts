import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApplication } from "@/lib/applications";
import { db } from "@/lib/db";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  dateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" }),
  university: z.string().min(1),
  yearOfStudy: z.string().min(1),
  spiritualBackground: z.string().min(1),
  whyJoin: z.string().min(1),
  howHeard: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await db.application.findFirst({
    where: { email: parsed.data.email, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An application already exists for this email." },
      { status: 409 },
    );
  }

  const photoEntry = formData.get("photo");
  let photo: File | undefined;
  if (photoEntry instanceof File && photoEntry.size > 0) {
    if (photoEntry.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Photo exceeds 5 MB limit" }, { status: 422 });
    }
    photo = photoEntry;
  }

  await createApplication(
    { ...parsed.data, dateOfBirth: new Date(parsed.data.dateOfBirth) },
    photo,
  );

  return NextResponse.json({ message: "submitted" }, { status: 201 });
}
