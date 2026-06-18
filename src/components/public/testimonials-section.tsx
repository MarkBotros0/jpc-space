"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "Student Stories",
    heading: "LIVES TRANSFORMED",
    testimonials: [
      {
        quote:
          "JPC didn't just teach me about Jesus — it showed me what it looks like to walk with Him every day. The Way season changed how I read Scripture, how I pray, and how I love people.",
        name: "Sara M.",
        role: "2nd Year, Medicine",
        initials: "SM",
        season: "The Way · 2024",
      },
      {
        quote:
          "I came in skeptical and left with a community I never expected. The depth of honesty in our small group is something I've never experienced anywhere else.",
        name: "Karim A.",
        role: "3rd Year, Engineering",
        initials: "KA",
        season: "The Way · 2023",
      },
      {
        quote:
          "Through GBV, I found that faith is not just for Sunday. It reaches into every broken place in society — and God calls us to be there too.",
        name: "Nadia R.",
        role: "Graduate, Social Work",
        initials: "NR",
        season: "GBV · 2023",
      },
    ],
  },
  ar: {
    kicker: "قصص الطلاب",
    heading: "حيوات تحوَّلت",
    testimonials: [
      {
        quote:
          "JPC لم تعلّمني فقط عن يسوع — بل أرتني كيف أسير معه كل يوم. غيّر موسم الطريق طريقة قراءتي للكتاب المقدس وصلاتي وحبّي للناس.",
        name: "سارة م.",
        role: "السنة الثانية، طب",
        initials: "سم",
        season: "الطريق · ٢٠٢٤",
      },
      {
        quote:
          "جئت متشككاً وغادرت بمجتمع لم أكن أتوقعه أبداً. عمق الصدق في مجموعتنا الصغيرة شيء لم أختبره في أي مكان آخر.",
        name: "كريم أ.",
        role: "السنة الثالثة، هندسة",
        initials: "كأ",
        season: "الطريق · ٢٠٢٣",
      },
      {
        quote:
          "من خلال GBV، اكتشفت أن الإيمان ليس للأحد فقط. يصل إلى كل مكان مكسور في المجتمع — والله يدعونا لنكون هناك.",
        name: "نادية ر.",
        role: "خريجة، عمل اجتماعي",
        initials: "نر",
        season: "GBV · ٢٠٢٣",
      },
    ],
  },
} as const;

const photoGradients = [
  "from-brand-teal-700 to-brand-navy-800",
  "from-brand-navy-700 to-brand-teal-800",
  "from-brand-teal-800 to-brand-navy-900",
] as const;

export function TestimonialsSection() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="relative overflow-hidden bg-brand-navy-900 px-4 py-20 md:py-28"
    >
      {/* Ghost heading watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-4 select-none text-center font-black leading-none tracking-[-0.06em] text-transparent"
        style={{
          fontSize: "clamp(3.5rem, 12vw, 10rem)",
          WebkitTextStroke: "1px rgba(93,185,188,0.07)",
        }}
      >
        {t.heading}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>
          <h2
            className="font-black leading-none tracking-[-0.04em] text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)" }}
          >
            {t.heading}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {t.testimonials.map((item, i) => (
            <figure
              key={item.name}
              className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal-500/25"
            >
              {/* Portrait photo area */}
              <div
                className={`relative h-32 bg-gradient-to-br ${photoGradients[i]} overflow-hidden`}
              >
                {/* Subtle pattern overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 70% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  }}
                />
                {/* Cross motif */}
                <svg
                  aria-hidden
                  className="absolute inset-0 m-auto opacity-10"
                  width="48"
                  height="48"
                  viewBox="0 0 40 40"
                  fill="white"
                >
                  <rect x="17" y="4" width="6" height="32" rx="3" />
                  <rect x="4" y="15" width="32" height="6" rx="3" />
                </svg>
                {/* Season label */}
                <span className="absolute end-3 top-3 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-semibold text-white/70 backdrop-blur-sm">
                  {item.season}
                </span>
                {/* Avatar overlapping into body */}
                <div className="absolute -bottom-6 start-5 flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-brand-navy-900 bg-gradient-to-br from-brand-teal-500 to-brand-teal-700 text-sm font-black text-white shadow-lg">
                  {item.initials}
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 pt-9">
                {/* Quote mark */}
                <svg
                  aria-hidden
                  className="mb-3 size-7 text-brand-teal-500 opacity-40"
                  viewBox="0 0 32 24"
                  fill="currentColor"
                >
                  <path d="M0 24V14.4C0 6.45 4.05 1.95 12.15 0L13.8 3C9.6 4.2 7.5 7.05 7.5 11.4H13.5V24H0zm18 0V14.4C18 6.45 22.05 1.95 30.15 0L31.8 3C27.6 4.2 25.5 7.05 25.5 11.4H31.5V24H18z" />
                </svg>
                <blockquote className="mb-5 text-sm leading-relaxed text-white/60">
                  {item.quote}
                </blockquote>
                <figcaption>
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  <p className="text-xs text-white/38">{item.role}</p>
                </figcaption>
              </div>

              {/* Hover inner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 48px rgba(93,185,188,0.04)" }}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
