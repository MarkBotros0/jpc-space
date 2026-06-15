"use client";

import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    heading: "Who We Are",
    mission: {
      title: "Our Mission",
      body: "To make disciples of Jesus Christ among university students in Egypt — equipping them to live by the Word, grow in community, and serve the world.",
    },
    vision: {
      title: "Our Vision",
      body: "A generation of university students transformed by the Gospel, rooted in the Church, and sent out to disciple nations.",
    },
  },
  ar: {
    heading: "من نحن",
    mission: {
      title: "رسالتنا",
      body: "تتلمذ طلاب الجامعة في مصر على يسوع المسيح — تجهيزهم للعيش بالكلمة، والنمو في المجتمع، وخدمة العالم.",
    },
    vision: {
      title: "رؤيتنا",
      body: "جيل من طلاب الجامعة متحوَّلين بالإنجيل، متجذِّرين في الكنيسة، ومُرسَلين لتتلمذ الأمم.",
    },
  },
} as const;

export function MissionSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section
      id="mission"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-brand-navy-950 px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
          {t.heading}
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {([t.mission, t.vision] as const).map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-brand-navy-900/60 p-8 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-lg font-semibold text-brand-teal-400">{card.title}</h3>
              <p className="leading-relaxed text-white/60">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
