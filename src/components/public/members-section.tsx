"use client";

import Link from "next/link";
import { LogIn, Users } from "lucide-react";
import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "JPC Community Portal",
    heading: "Already a JPC Member?",
    sub: "Log in to access your sessions, assignments, prayer journal, and community.",
    cta: "Member Login →",
    divider: "or",
    alumniHeading: "JPC Graduate / Alumni?",
    alumniSub: "Your journey doesn't end here. Stay connected with the community.",
    alumniBtn: "Alumni Hub — Coming Soon",
  },
  ar: {
    kicker: "بوابة مجتمع JPC",
    heading: "هل أنت عضو في JPC؟",
    sub: "سجِّل دخولك للوصول إلى جلساتك ومهامك ومجلة صلاتك والمجتمع.",
    cta: "← دخول الأعضاء",
    divider: "أو",
    alumniHeading: "خريج JPC؟",
    alumniSub: "رحلتك لا تنتهي هنا. ابقَ على تواصل مع المجتمع.",
    alumniBtn: "مركز الخريجين — قريباً",
  },
} as const;

export function MembersSection() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="relative overflow-hidden bg-brand-navy-950 px-4 py-20 md:py-28"
    >
      {/* Sparse dot-grid background */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.02]"
      >
        <defs>
          <pattern
            id="members-dots"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#members-dots)" />
      </svg>

      {/* Center teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(93,185,188,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Glassmorphism card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_8px_48px_rgba(0,0,0,0.4)] backdrop-blur-md md:p-14">
          {/* Kicker */}
          <span className="mb-4 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>

          {/* Member login block */}
          <div className="mb-2 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-teal-500/15 text-brand-teal-400">
              <LogIn className="size-6" />
            </div>
          </div>
          <h2 className="mb-3 mt-4 text-2xl font-bold text-white md:text-3xl">
            {t.heading}
          </h2>
          <p className="mb-7 text-sm leading-relaxed text-white/50">{t.sub}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-brand-teal-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(93,185,188,0.3)] transition-all duration-200 hover:-translate-y-px hover:bg-brand-teal-400 hover:shadow-[0_0_32px_rgba(93,185,188,0.4)]"
          >
            {t.cta}
          </Link>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <hr className="flex-1 border-white/10" />
            <span className="text-xs text-white/25">{t.divider}</span>
            <hr className="flex-1 border-white/10" />
          </div>

          {/* Alumni block */}
          <div className="flex justify-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/8 text-white/40">
              <Users className="size-5" />
            </div>
          </div>
          <h3 className="mb-2 mt-4 text-base font-semibold text-white/70">
            {t.alumniHeading}
          </h3>
          <p className="mb-5 text-sm text-white/35">{t.alumniSub}</p>
          <button
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-2.5 text-sm font-medium text-white/30"
          >
            {t.alumniBtn}
          </button>
        </div>
      </div>
    </section>
  );
}
