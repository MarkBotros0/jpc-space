import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/post-login";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — JPC Portal" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user?.role) {
    redirect(params.callbackUrl ?? dashboardPathForRole(session.user.role));
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mb-6 text-sm text-zinc-600">JPC Portal</p>
        <LoginForm callbackUrl={params.callbackUrl} />
      </div>
    </main>
  );
}
