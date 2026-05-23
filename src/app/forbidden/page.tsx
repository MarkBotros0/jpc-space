import Link from "next/link";
import { signOut } from "@/lib/auth";

export const metadata = { title: "Forbidden — JPC Portal" };

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">403 — Forbidden</h1>
        <p className="mb-6 text-sm text-zinc-600">
          You don&apos;t have access to that page with your current role.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
          >
            Home
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
