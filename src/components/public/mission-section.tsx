"use client";

import { BookOpen, Globe } from "lucide-react";
import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    kicker: "Who We Are",
    heading: "Built on Faith, Community & Purpose",
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
    kicker: "من نحن",
    heading: "مبنيّ على الإيمان والمجتمع والهدف",
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

const icons = [BookOpen, Globe] as const;

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
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>
          <h2 className="text-3xl font-bold text-white md:text-4xl">{t.heading}</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {([t.mission, t.vision] as const).map((card, i) => {
            const Icon = icons[i];
            return (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 border-s-brand-teal-500/60 bg-brand-navy-900/60 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 [border-inline-start-width:2px] md:p-10"
              >
                {/* Subtle glow behind card */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 start-0 h-32 w-32 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at 0% 100%, rgba(93,185,188,0.12) 0%, transparent 60%)",
                  }}
                />
                <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-brand-teal-500/15 text-brand-teal-400">
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-brand-teal-400">{card.title}</h3>
                <p className="leading-relaxed text-white/60">{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
