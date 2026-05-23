import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export function DashboardShell({
  user,
  title,
  children,
}: {
  user: SessionUser;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-4 text-sm text-zinc-600">
          Signed in as <span className="font-medium text-zinc-900">{user.role}</span>{" "}
          (user id {user.userId})
        </p>
        {children}
      </section>
    </main>
  );
}
