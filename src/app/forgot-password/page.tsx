import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/lib/auth/password-reset";

export const metadata = { title: "Forgot password — JPC Portal" };

async function forgotAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (email) await requestPasswordReset(email);
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Forgot password</h1>
        <p className="mb-6 text-sm text-zinc-600">
          We will email you a reset link. In development, look in the dev server console for the link.
        </p>
        {params.sent ? (
          <p className="mb-4 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : null}
        <form action={forgotAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Email</span>
            <input
              name="email"
              type="email"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Send reset link
          </button>
        </form>
      </div>
    </main>
  );
}
