"use client";

import Link from "next/link";
import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    headline: "Grow in Faith.\nBuild Community.\nTransform Lives.",
    sub: "JPC is a discipleship community for university students — walking together through The Way, GBV, and beyond.",
    cta: "Apply Now",
    learn: "Learn More ↓",
  },
  ar: {
    headline: "انمُ في الإيمان.\nابنِ مجتمعاً.\nغيِّر حياة.",
    sub: "JPC مجتمع تلمذة لطلاب الجامعة — نسير معاً في الطريق، GBV، وما هو أبعد.",
    cta: "قدِّم الآن",
    learn: "اعرف أكثر ↓",
  },
} as const;

export function HeroSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative flex min-h-[85dvh] flex-col items-center justify-center overflow-hidden bg-brand-navy-900 px-4 py-24 text-center md:py-36"
    >
      {/* Radial accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(93,185,188,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal-400">
          Jesus Project Community
        </p>
        <h1 className="mb-6 whitespace-pre-line text-4xl font-bold leading-tight text-white md:text-6xl">
          {t.headline}
        </h1>
        <p className="mb-10 text-base leading-relaxed text-white/60 md:text-lg">{t.sub}</p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/apply"
            className="w-full rounded-xl bg-brand-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-pop)] transition-all duration-200 hover:-translate-y-px hover:bg-brand-teal-400 sm:w-auto"
          >
            {t.cta}
          </Link>
          <a
            href="#mission"
            className="w-full rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white/70 transition-all duration-200 hover:border-white/40 hover:text-white sm:w-auto"
          >
            {t.learn}
          </a>
        </div>
      </div>
    </section>
  );
}
