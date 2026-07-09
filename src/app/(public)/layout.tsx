import { LangProvider } from "@/components/public/lang-context";
import { PublicNavbar } from "@/components/public/public-navbar";
import { PublicFooter } from "@/components/public/public-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="flex min-h-dvh flex-col bg-brand-navy-950 text-white">
        <PublicNavbar />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </LangProvider>
  );
}
