import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/auth/password-reset";

export const metadata = { title: "Reset password — JPC Portal" };

async function resetAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await resetPassword(token, password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not reset password.";
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(msg)}`);
  }
  redirect("/login?reset=1");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Reset password</h1>
        <p className="mb-6 text-sm text-zinc-600">Enter a new password (min 8 characters).</p>
        {params.error ? (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
        ) : null}
        <form action={resetAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={params.token ?? ""} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">New password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Set new password
          </button>
        </form>
      </div>
    </main>
  );
}
