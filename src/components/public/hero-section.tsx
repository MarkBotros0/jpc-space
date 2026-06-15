"use client";

import Link from "next/link";
import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "Jesus Project Community",
    headline: "Grow in Faith.\nBuild Community.\nTransform Lives.",
    sub: "JPC is a discipleship community for university students — walking together through The Way, GBV, and beyond.",
    cta: "Apply Now",
    learn: "Learn More",
    stats: [
      { value: "5+", label: "Seasons" },
      { value: "200+", label: "Students" },
      { value: "10+", label: "Years" },
    ],
  },
  ar: {
    kicker: "مجتمع مشروع يسوع",
    headline: "انمُ في الإيمان.\nابنِ مجتمعاً.\nغيِّر حياة.",
    sub: "JPC مجتمع تلمذة لطلاب الجامعة — نسير معاً في الطريق، GBV، وما هو أبعد.",
    cta: "قدِّم الآن",
    learn: "اعرف أكثر",
    stats: [
      { value: "+٥", label: "مواسم" },
      { value: "+٢٠٠", label: "طالب" },
      { value: "+١٠", label: "سنوات" },
    ],
  },
} as const;

export function HeroSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative flex min-h-[90dvh] flex-col items-center justify-center overflow-hidden bg-brand-navy-900 px-4 py-24 text-center md:py-36"
    >
      {/* Dot-grid pattern */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.025]">
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>

      {/* Top-center teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(93,185,188,0.15) 0%, transparent 70%)",
        }}
      />
      {/* Bottom-right accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 500px at 100% 100%, rgba(93,185,188,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Kicker pill */}
        <span className="mb-6 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-teal-300">
          {t.kicker}
        </span>

        <h1
          className="mb-6 whitespace-pre-line font-bold leading-tight tracking-tight text-white"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5rem)" }}
        >
          {t.headline}
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
          {t.sub}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/apply"
            className="w-full rounded-xl bg-brand-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_30px_rgba(93,185,188,0.35)] transition-all duration-200 hover:-translate-y-px hover:bg-brand-teal-400 hover:shadow-[0_0_40px_rgba(93,185,188,0.45)] sm:w-auto"
          >
            {t.cta}
          </Link>
          <a
            href="#mission"
            className="w-full rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white/70 transition-all duration-200 hover:border-white/40 hover:text-white sm:w-auto"
          >
            {t.learn} ↓
          </a>
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap justify-center gap-x-0 gap-y-4">
          {t.stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-8 text-center ${i > 0 ? "border-s border-white/15" : ""}`}
            >
              <p className="text-2xl font-bold text-white md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-white/40 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
