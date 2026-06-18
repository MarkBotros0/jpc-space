"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "The Journey",
    heading: "THE JPC PATH",
    programs: [
      {
        step: "01",
        name: "The Way",
        desc: "The foundational discipleship season. Learn to walk with Jesus, study Scripture, and build deep community.",
        detail: "10 weeks · Weekly sessions · Small group",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      },
      {
        step: "02",
        name: "GBV",
        desc: "Going Beyond Violence — applied ministry and servant leadership in real-world contexts of pain and need.",
        detail: "12 weeks · Field visits · Team projects",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        ),
      },
      {
        step: "03",
        name: "3G",
        desc: "Go, Grow, Give — equipping graduates to disciple others and multiply the community they received.",
        detail: "Ongoing · Mentorship · Leadership",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
          </svg>
        ),
      },
    ],
  },
  ar: {
    kicker: "الرحلة",
    heading: "مسار JPC",
    programs: [
      {
        step: "٠١",
        name: "الطريق",
        desc: "موسم التلمذة الأساسي. تعلَّم كيف تسير مع يسوع، وتدرس الكتاب المقدس، وتبني مجتمعاً عميقاً.",
        detail: "١٠ أسابيع · جلسات أسبوعية · مجموعة صغيرة",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      },
      {
        step: "٠٢",
        name: "GBV",
        desc: "تجاوز العنف — خدمة تطبيقية وقيادة خادمة في سياقات واقعية من الألم والحاجة.",
        detail: "١٢ أسبوعاً · زيارات ميدانية · مشاريع جماعية",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        ),
      },
      {
        step: "٠٣",
        name: "3G",
        desc: "اذهب، انمُ، أعطِ — تجهيز الخريجين لتتلمذ الآخرين ومضاعفة المجتمع الذي تلقوه.",
        detail: "مستمر · إرشاد · قيادة",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
          </svg>
        ),
      },
    ],
  },
} as const;

export function ProgramsSection() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="relative overflow-hidden bg-brand-navy-950 px-4 py-20 md:py-28"
    >
      {/* Giant ghost heading */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-6 select-none text-center font-black leading-none tracking-[-0.06em] text-transparent"
        style={{
          fontSize: "clamp(5rem, 18vw, 14rem)",
          WebkitTextStroke: "1px rgba(93,185,188,0.1)",
        }}
      >
        {t.heading}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>
          <h2
            className="font-black leading-none tracking-[-0.04em] text-white"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
          >
            {t.heading}
          </h2>
        </div>

        {/* Numbered hover list */}
        <div className="divide-y divide-white/[0.07]">
          {t.programs.map((p) => (
            <div
              key={p.step}
              className="group flex items-center gap-6 py-8 transition-colors duration-200 md:gap-10 md:py-10"
            >
              {/* Step number */}
              <span
                className="shrink-0 font-black leading-none tracking-[-0.04em] text-white/[0.06] transition-colors duration-300 group-hover:text-brand-teal-500/40"
                style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
              >
                {p.step}
              </span>

              {/* Icon */}
              <div className="hidden shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 text-brand-teal-400 transition-all duration-300 group-hover:border-brand-teal-500/30 group-hover:bg-brand-teal-500/10 md:flex">
                {p.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 text-2xl font-black tracking-[-0.03em] text-white transition-colors duration-200 group-hover:text-brand-teal-300 md:text-3xl">
                  {p.name}
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-white/50 md:text-base">
                  {p.desc}
                </p>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/40">
                  {p.detail}
                </span>
              </div>

              {/* Arrow */}
              <span className="shrink-0 text-2xl text-brand-teal-500 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 md:text-3xl">
                {dir === "rtl" ? "←" : "→"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
