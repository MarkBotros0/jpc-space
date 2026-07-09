"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "Life at JPC",
    heading: "Where Faith Meets\nEveryday Life",
    sub: "Discipleship isn't a programme — it's a way of life. From early morning prayer to late-night conversations, JPC shapes the whole person.",
    tiles: [
      { label: "Bible Study", gradient: "from-brand-teal-800 to-brand-navy-900" },
      { label: "Community", gradient: "from-brand-navy-700 to-brand-teal-900" },
      { label: "Worship", gradient: "from-brand-teal-700 to-brand-navy-800" },
      { label: "Discipleship", gradient: "from-brand-navy-800 to-brand-teal-800" },
      { label: "Service", gradient: "from-brand-teal-900 to-brand-navy-700" },
      { label: "Leadership", gradient: "from-brand-navy-900 to-brand-teal-700" },
    ],
    cta: "Apply to Be Part of It →",
  },
  ar: {
    kicker: "الحياة في JPC",
    heading: "حيث يلتقي الإيمان\nبالحياة اليومية",
    sub: "التلمذة ليست برنامجاً — بل هي أسلوب حياة. من الصلاة الصباحية الباكرة إلى المحادثات في وقت متأخر من الليل، JPC تشكّل الإنسان كله.",
    tiles: [
      { label: "دراسة الكتاب", gradient: "from-brand-teal-800 to-brand-navy-900" },
      { label: "المجتمع", gradient: "from-brand-navy-700 to-brand-teal-900" },
      { label: "التسبيح", gradient: "from-brand-teal-700 to-brand-navy-800" },
      { label: "التلمذة", gradient: "from-brand-navy-800 to-brand-teal-800" },
      { label: "الخدمة", gradient: "from-brand-teal-900 to-brand-navy-700" },
      { label: "القيادة", gradient: "from-brand-navy-900 to-brand-teal-700" },
    ],
    cta: "← قدِّم لتكون جزءاً منه",
  },
} as const;

/* SVG icons for each tile */
const tileIcons = [
  /* Bible/Book */
  <svg key="book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>,
  /* People/Community */
  <svg key="people" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>,
  /* Music/Worship */
  <svg key="music" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
  </svg>,
  /* Cross/Discipleship */
  <svg key="cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
  </svg>,
  /* Heart/Service */
  <svg key="heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>,
  /* Globe/Leadership */
  <svg key="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 opacity-50">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>,
];

export function CommunitySection() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="bg-brand-navy-900 px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
              {t.kicker}
            </span>
            <h2 className="whitespace-pre-line text-3xl font-bold text-white md:text-4xl">
              {t.heading}
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/45 md:text-right">{t.sub}</p>
        </div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {t.tiles.map((tile, i) => (
            <div
              key={tile.label}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${tile.gradient} ${
                i === 0 ? "col-span-2 md:col-span-1" : ""
              } aspect-square cursor-default`}
            >
              {/* Overlay pattern */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)",
                }}
              />

              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white transition-transform duration-500 group-hover:scale-110">
                {tileIcons[i]}
              </div>

              {/* Label */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-sm font-semibold text-white">{tile.label}</p>
              </div>

              {/* Hover teal shimmer */}
              <div
                aria-hidden
                className="absolute inset-0 bg-brand-teal-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/apply"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-brand-teal-500/50 hover:text-white cursor-pointer"
          >
            {t.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
