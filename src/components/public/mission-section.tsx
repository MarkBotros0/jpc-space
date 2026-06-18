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
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <section
      id="mission"
      dir={dir}
      className="relative overflow-hidden bg-brand-navy-950 px-4 py-20 md:py-28"
    >
      {/* Ghost word watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-4 select-none text-center font-black leading-none tracking-[-0.06em] text-transparent"
        style={{
          fontSize: "clamp(4rem, 15vw, 12rem)",
          WebkitTextStroke: "1px rgba(93,185,188,0.09)",
        }}
      >
        {lang === "ar" ? "رسالة" : "MISSION"}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-teal-500/30 bg-brand-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-400">
            {t.kicker}
          </span>
          <h2
            className="font-black leading-[0.95] tracking-[-0.04em] text-white"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            {t.heading}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {([t.mission, t.vision] as const).map((card, i) => {
            const Icon = icons[i];
            return (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal-500/25 md:p-10"
              >
                {/* Teal border accent on start side */}
                <div className="absolute inset-y-0 start-0 w-[2px] rounded-full bg-brand-teal-500/50" />

                {/* Hover glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 start-0 h-40 w-40 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at 0% 100%, rgba(93,185,188,0.12) 0%, transparent 60%)",
                  }}
                />

                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-brand-teal-500/15 text-brand-teal-400 transition-colors duration-200 group-hover:bg-brand-teal-500/25">
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-brand-teal-300">{card.title}</h3>
                <p className="text-base leading-relaxed text-white/58">{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
