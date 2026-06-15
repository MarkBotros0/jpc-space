"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "Student Stories",
    heading: "Lives Transformed",
    sub: "Hear from students who walked through The Way.",
    testimonials: [
      {
        quote:
          "JPC didn't just teach me about Jesus — it showed me what it looks like to walk with Him every day. The Way season changed how I read Scripture, how I pray, and how I love people.",
        name: "Sara M.",
        role: "2nd Year, Medicine",
        initials: "SM",
      },
      {
        quote:
          "I came in skeptical and left with a community I never expected. The depth of honesty in our small group is something I've never experienced anywhere else.",
        name: "Karim A.",
        role: "3rd Year, Engineering",
        initials: "KA",
      },
      {
        quote:
          "Through GBV, I found that faith is not just for Sunday. It reaches into every broken place in society — and God calls us to be there too.",
        name: "Nadia R.",
        role: "Graduate, Social Work",
        initials: "NR",
      },
    ],
  },
  ar: {
    kicker: "قصص الطلاب",
    heading: "حيوات تحوَّلت",
    sub: "اسمع من طلاب ساروا خلال موسم الطريق.",
    testimonials: [
      {
        quote:
          "JPC لم تعلّمني فقط عن يسوع — بل أرتني كيف أسير معه كل يوم. غيّر موسم الطريق طريقة قراءتي للكتاب المقدس وصلاتي وحبّي للناس.",
        name: "سارة م.",
        role: "السنة الثانية، طب",
        initials: "سم",
      },
      {
        quote:
          "جئت متشككاً وغادرت بمجتمع لم أكن أتوقعه أبداً. عمق الصدق في مجموعتنا الصغيرة شيء لم أختبره في أي مكان آخر.",
        name: "كريم أ.",
        role: "السنة الثالثة، هندسة",
        initials: "كأ",
      },
      {
        quote:
          "من خلال GBV، اكتشفت أن الإيمان ليس للأحد فقط. يصل إلى كل مكان مكسور في المجتمع — والله يدعونا لنكون هناك.",
        name: "نادية ر.",
        role: "خريجة، عمل اجتماعي",
        initials: "نر",
      },
    ],
  },
} as const;

const avatarColors = [
  "from-brand-teal-600 to-brand-teal-800",
  "from-brand-navy-600 to-brand-navy-800",
  "from-brand-teal-700 to-brand-navy-700",
] as const;

export function TestimonialsSection() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="relative overflow-hidden bg-brand-navy-950 px-4 py-20 md:py-28"
    >
      {/* Diagonal line texture */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.015]"
      >
        <defs>
          <pattern
            id="diag-lines"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diag-lines)" />
      </svg>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="mb-3 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>
          <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">{t.heading}</h2>
          <p className="text-white/45">{t.sub}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {t.testimonials.map((item, i) => (
            <figure
              key={item.name}
              className="group relative flex flex-col rounded-2xl border border-white/8 bg-white/5 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal-500/25 hover:bg-white/8"
            >
              {/* Large decorative quote mark */}
              <svg
                aria-hidden
                className="mb-4 size-8 text-brand-teal-500 opacity-40"
                viewBox="0 0 32 24"
                fill="currentColor"
              >
                <path d="M0 24V14.4C0 6.45 4.05 1.95 12.15 0L13.8 3C9.6 4.2 7.5 7.05 7.5 11.4H13.5V24H0zm18 0V14.4C18 6.45 22.05 1.95 30.15 0L31.8 3C27.6 4.2 25.5 7.05 25.5 11.4H31.5V24H18z" />
              </svg>

              <blockquote className="flex-1 text-sm leading-relaxed text-white/65">
                {item.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[i]} text-xs font-bold text-white`}
                >
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/40">{item.role}</p>
                </div>
              </figcaption>

              {/* Hover teal glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  boxShadow: "inset 0 0 40px rgba(93,185,188,0.04)",
                }}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
