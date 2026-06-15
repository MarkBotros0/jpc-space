"use client";

import Link from "next/link";
import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    heading: "How to Join",
    steps: [
      "Submit your application",
      "Application reviewed by the team",
      "Receive acceptance email with invite link",
      "Start The Way season",
    ],
    cta: "Apply Now →",
  },
  ar: {
    heading: "كيف تنضم",
    steps: [
      "قدِّم طلبك",
      "مراجعة الطلب من الفريق",
      "استلم بريد القبول مع رابط الدعوة",
      "ابدأ موسم الطريق",
    ],
    cta: "قدِّم الآن →",
  },
} as const;

export function HowToJoinSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-brand-teal-700 px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-12 text-3xl font-bold text-white md:text-4xl">{t.heading}</h2>
        <div className="mb-12 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {t.steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm font-medium leading-snug text-white/90">{step}</p>
            </div>
          ))}
        </div>
        <Link
          href="/apply"
          className="inline-block rounded-xl bg-white px-10 py-3.5 text-base font-semibold text-brand-teal-700 shadow-[var(--shadow-pop)] transition-all duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-lift)]"
        >
          {t.cta}
        </Link>
      </div>
    </section>
  );
}
