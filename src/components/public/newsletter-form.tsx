"use client";

import * as React from "react";
import { useLang } from "@/components/public/lang-context";

const content = {
  en: {
    heading: "Stay in the Loop",
    sub: "Get updates about upcoming seasons, events, and community news.",
    placeholder: "your@email.com",
    cta: "Subscribe",
    success: "You're subscribed! Check your inbox.",
    already: "You're already subscribed.",
    error: "Something went wrong. Please try again.",
  },
  ar: {
    heading: "ابقَ على اطلاع",
    sub: "احصل على تحديثات حول المواسم القادمة والفعاليات وأخبار المجتمع.",
    placeholder: "بريدك@الإلكتروني.com",
    cta: "اشترك",
    success: "تم اشتراكك! تحقق من بريدك.",
    already: "أنت مشترك بالفعل.",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
} as const;

type Status = "idle" | "loading" | "success" | "already" | "error";

export function NewsletterForm() {
  const { lang } = useLang();
  const t = content[lang];
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: string };
        setStatus(data.message === "already_subscribed" ? "already" : "success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "success" ? t.success :
    status === "already" ? t.already :
    status === "error" ? t.error : null;

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-brand-navy-900 px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 className="mb-3 text-3xl font-bold text-white">{t.heading}</h2>
        <p className="mb-8 text-white/50">{t.sub}</p>

        {message ? (
          <p className="rounded-xl border border-brand-teal-500/30 bg-brand-teal-500/10 px-6 py-4 text-sm text-brand-teal-300">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.placeholder}
              className="h-11 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-brand-teal-500 focus:ring-2 focus:ring-brand-teal-500/30"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-brand-teal-500 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-teal-400 disabled:opacity-60"
            >
              {status === "loading" ? "…" : t.cta}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
