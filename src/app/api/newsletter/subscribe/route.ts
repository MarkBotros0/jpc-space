import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendNewsletterConfirmation } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "already_subscribed" }, { status: 200 });
  }

  await db.newsletterSubscriber.create({ data: { email } });

  try {
    await sendNewsletterConfirmation(email);
  } catch (err) {
    console.error("[newsletter] confirmation email failed:", err);
  }

  return NextResponse.json({ message: "subscribed" }, { status: 201 });
}
