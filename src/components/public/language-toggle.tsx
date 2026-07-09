"use client";

import { useLang } from "@/components/public/lang-context";

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold tracking-widest text-white/70 transition-all duration-200 hover:border-white/40 hover:text-white"
      aria-label="Toggle language"
    >
      {lang === "en" ? "AR" : "EN"}
    </button>
  );
}
