import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function PublicFooter() {
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL;
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@jpcspace.com";

  return (
    <footer className="border-t border-white/10 bg-brand-navy-950 py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link href="/">
            <Logo size="sm" showWordmark />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/40 transition-colors hover:text-white"
              >
                Instagram
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/40 transition-colors hover:text-white"
              >
                Facebook
              </a>
            )}
            <a
              href={`mailto:${contactEmail}`}
              className="text-sm text-white/40 transition-colors hover:text-white"
            >
              {contactEmail}
            </a>
          </div>

          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Jesus Project Community — JPC Space
          </p>
        </div>
      </div>
    </footer>
  );
}
