"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    heading: "The JPC Journey",
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
    heading: "رحلة JPC",
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
        <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
          {t.heading}
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {t.programs.map((p) => (
            <div
              key={p.step}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-8"
            >
              <span className="mb-4 block text-5xl font-bold text-white/10">{p.step}</span>
              <h3 className="mb-3 text-xl font-semibold text-white">{p.name}</h3>
              <p className="text-sm leading-relaxed text-white/60">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
