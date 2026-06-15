"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "The Journey",
    heading: "The JPC Path",
    programs: [
      {
        step: "01",
        name: "The Way",
        desc: "The foundational discipleship season. Learn to walk with Jesus, study Scripture, and build deep community.",
      },
      {
        step: "02",
        name: "GBV",
        desc: "Going Beyond Violence — applied ministry and servant leadership in real-world contexts.",
      },
      {
        step: "03",
        name: "3G",
        desc: "Go, Grow, Give — equipping graduates to disciple others and multiply the community.",
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
      },
      {
        step: "٠٢",
        name: "GBV",
        desc: "تجاوز العنف — خدمة تطبيقية وقيادة خادمة في سياقات واقعية.",
      },
      {
        step: "٠٣",
        name: "3G",
        desc: "اذهب، انمُ، أعطِ — تجهيز الخريجين لتتلمذ الآخرين ومضاعفة المجتمع.",
      },
    ],
  },
} as const;

export function ProgramsSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-brand-navy-900 px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>
          <h2 className="text-3xl font-bold text-white md:text-4xl">{t.heading}</h2>
        </div>

        {/* Desktop: cards with arrows; Mobile: stacked cards */}
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
          {t.programs.map((p, i) => (
            <div key={p.step} className="contents md:contents">
              <div
                className="flex-1 rounded-2xl border border-white/10 border-t-2 border-t-brand-teal-500/50 bg-white/5 p-8 transition-transform duration-300 hover:-translate-y-1 md:rounded-2xl"
              >
                <span className="mb-4 block font-mono text-xs font-semibold tracking-[0.2em] text-brand-teal-400">
                  {p.step}
                </span>
                <h3 className="mb-3 text-xl font-semibold text-white">{p.name}</h3>
                <p className="text-sm leading-relaxed text-white/55">{p.desc}</p>
              </div>
              {i < t.programs.length - 1 && (
                <div
                  aria-hidden
                  className="hidden items-center justify-center px-3 text-xl text-brand-teal-500/30 md:flex"
                >
                  {lang === "ar" ? "←" : "→"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
