"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    verse:
      "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you.",
    reference: "Matthew 28:19–20",
    tagline: "The mission that drives everything we do.",
  },
  ar: {
    verse:
      "اذهبوا وتلمذوا جميع الأمم، وعمِّدوهم باسم الآب والابن والروح القدس، وعلِّموهم أن يحفظوا جميع ما أوصيتكم به.",
    reference: "متى ٢٨ : ١٩–٢٠",
    tagline: "الرسالة التي تقود كل ما نفعله.",
  },
} as const;

export function ScriptureSection() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="relative overflow-hidden bg-brand-navy-800 px-4 py-24 md:py-32"
    >
      {/* Oversized ghost quote mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute start-4 top-0 select-none font-black leading-none text-transparent"
        style={{
          fontSize: "clamp(10rem, 30vw, 22rem)",
          WebkitTextStroke: "1px rgba(255,255,255,0.04)",
          lineHeight: "0.8",
        }}
      >
        &ldquo;
      </div>

      {/* Radial teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(93,185,188,0.09) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Cross monogram */}
        <div className="mb-8 flex justify-center">
          <svg
            aria-hidden
            width="44"
            height="44"
            viewBox="0 0 40 40"
            fill="none"
            className="text-brand-teal-500"
            style={{ opacity: 0.75 }}
          >
            <rect x="17" y="4" width="6" height="32" rx="3" fill="currentColor" />
            <rect x="4" y="15" width="32" height="6" rx="3" fill="currentColor" />
          </svg>
        </div>

        <blockquote
          className="mb-7 font-medium italic leading-relaxed text-white/78"
          style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.55rem)" }}
        >
          &ldquo;{t.verse}&rdquo;
        </blockquote>

        <cite className="block text-xs font-bold not-italic uppercase tracking-[0.28em] text-brand-teal-400">
          — {t.reference}
        </cite>

        <div className="mt-5 flex justify-center">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/35">
            {t.tagline}
          </span>
        </div>
      </div>
    </section>
  );
}
