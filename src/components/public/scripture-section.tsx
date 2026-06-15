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
      className="relative overflow-hidden bg-brand-navy-900 px-4 py-24 md:py-32"
    >
      {/* Large decorative quotation mark */}
      <svg
        aria-hidden
        className="pointer-events-none absolute start-8 top-8 size-32 opacity-[0.04] md:size-48"
        viewBox="0 0 100 80"
        fill="currentColor"
      >
        <path d="M0 80V48C0 21.5 13.5 6.5 40.5 0L46 10C32 14 25 23.5 25 38h15V80H0zm54 0V48C54 21.5 67.5 6.5 94.5 0L100 10C86 14 79 23.5 79 38h15V80H54z" />
      </svg>

      {/* Radial glow centre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(93,185,188,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center">
          {/* Cross monogram */}
          <svg
            aria-hidden
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            className="text-brand-teal-500 opacity-70"
          >
            <rect x="17" y="4" width="6" height="32" rx="3" fill="currentColor" />
            <rect x="4" y="15" width="32" height="6" rx="3" fill="currentColor" />
          </svg>
        </div>

        <blockquote
          className="mb-6 text-xl font-medium italic leading-relaxed text-white/80 md:text-2xl md:leading-relaxed"
          style={{ fontStyle: "italic" }}
        >
          &ldquo;{t.verse}&rdquo;
        </blockquote>

        <cite className="block text-sm font-semibold not-italic tracking-widest text-brand-teal-400 uppercase">
          {t.reference}
        </cite>

        <p className="mt-4 text-sm text-white/35">{t.tagline}</p>
      </div>
    </section>
  );
}
