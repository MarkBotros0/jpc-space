import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { dashboardPathForRole } from "@/lib/auth/post-login";
import { Logo } from "@/components/ui/logo";
import { LanguageToggle } from "@/components/public/language-toggle";

export async function PublicNavbar() {
  const user = await getCurrentUser();
  const dashboardHref = user ? dashboardPathForRole(user.role) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy-900/95 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size="sm" showWordmark />
        </Link>

        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              className="rounded-full bg-brand-teal-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(93,185,188,0.25)] transition-all duration-200 hover:bg-brand-teal-400 hover:-translate-y-px"
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/apply"
                className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/40 hover:text-white"
              >
                Apply
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-brand-teal-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(93,185,188,0.25)] transition-all duration-200 hover:bg-brand-teal-400 hover:-translate-y-px"
              >
                Member Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
