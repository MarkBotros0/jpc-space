"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/lib/auth";

const schema = z.object({ email: z.string().email() });

export type DevSwitchState = { error?: string } | null;

export async function devSwitchUserAction(
  _prev: DevSwitchState,
  formData: FormData,
): Promise<DevSwitchState> {
  if (process.env.DEV_USER_SWITCHER !== "1") {
    return { error: "Not available." };
  }

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Invalid user." };

  try {
    await signIn("dev-switch", {
      email: parsed.data.email,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Switch failed." };
    throw err;
  }

  return null;
}
