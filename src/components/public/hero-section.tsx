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

function CrossIllustration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 320"
      fill="none"
      className="pointer-events-none absolute inset-0 m-auto h-full w-full max-w-2xl opacity-[0.045]"
      style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      {/* Outer circle */}
      <circle cx="160" cy="160" r="150" stroke="white" strokeWidth="0.75" />
      {/* Middle circle */}
      <circle cx="160" cy="160" r="100" stroke="white" strokeWidth="0.5" />
      {/* Inner circle */}
      <circle cx="160" cy="160" r="55" stroke="white" strokeWidth="0.5" />

      {/* Radiating lines (compass-rose style) */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = 160 + 58 * Math.cos(angle);
        const y1 = 160 + 58 * Math.sin(angle);
        const x2 = 160 + 147 * Math.cos(angle);
        const y2 = 160 + 147 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="white"
            strokeWidth={i % 4 === 0 ? "0.75" : "0.35"}
            opacity={i % 4 === 0 ? 1 : 0.5}
          />
        );
      })}

      {/* Cross */}
      <rect x="154" y="110" width="12" height="80" rx="2" fill="white" />
      <rect x="120" y="148" width="80" height="12" rx="2" fill="white" />

      {/* Four corner diamond dots */}
      <polygon points="160,8 163,15 160,22 157,15" fill="white" />
      <polygon points="160,298 163,305 160,312 157,305" fill="white" />
      <polygon points="8,160 15,163 22,160 15,157" fill="white" />
      <polygon points="298,160 305,163 312,160 305,157" fill="white" />
    </svg>
  );
}

export function HeroSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative flex min-h-[92dvh] flex-col items-center justify-center overflow-hidden bg-brand-navy-900 px-4 py-24 text-center md:py-36"
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

      {/* Cross + compass rose illustration */}
      <CrossIllustration />

      {/* Top-centre teal atmospheric glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 10%, rgba(93,185,188,0.13) 0%, transparent 65%)",
        }}
      />
      {/* Bottom-right warm accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 400px at 95% 95%, rgba(93,185,188,0.055) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Kicker pill */}
        <span className="mb-7 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-teal-300">
          {t.kicker}
        </span>

        <h1
          className="mb-6 whitespace-pre-line font-bold leading-[1.08] tracking-tight text-white"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}
        >
          {t.headline}
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/50 md:text-lg">
          {t.sub}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/apply"
            className="w-full rounded-xl bg-brand-teal-500 px-10 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(93,185,188,0.4)] transition-all duration-200 hover:-translate-y-px hover:bg-brand-teal-400 hover:shadow-[0_0_45px_rgba(93,185,188,0.5)] sm:w-auto"
          >
            {t.cta}
          </Link>
          <a
            href="#mission"
            className="w-full rounded-xl border border-white/15 px-10 py-4 text-base font-semibold text-white/60 transition-all duration-200 hover:border-white/35 hover:text-white sm:w-auto"
          >
            {t.learn} ↓
          </a>
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap justify-center gap-x-0 gap-y-6">
          {t.stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-8 text-center ${i > 0 ? "border-s border-white/12" : ""}`}
            >
              <p className="text-3xl font-bold text-white md:text-4xl">{s.value}</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
