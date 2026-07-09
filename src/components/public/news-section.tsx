"use client";

import { format } from "date-fns";
import { useLang } from "@/components/public/lang-context";
import type { JpcPost } from "@/generated/prisma/client";

interface NewsSectionProps {
  posts: Pick<JpcPost, "id" | "title" | "titleAr" | "body" | "bodyAr" | "publishedAt">[];
}

export function NewsSection({ posts }: NewsSectionProps) {
  const { lang } = useLang();

  if (posts.length === 0) return null;

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-brand-navy-950 px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-3xl font-bold text-white md:text-4xl">
          {lang === "ar" ? "أخبار وتحديثات" : "News & Updates"}
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-white/10 bg-brand-navy-900/60 p-6"
            >
              {post.publishedAt && (
                <time className="mb-3 block text-xs text-white/40">
                  {format(new Date(post.publishedAt), "dd MMM yyyy")}
                </time>
              )}
              <h3 className="mb-3 font-semibold leading-snug text-white">
                {lang === "ar" && post.titleAr ? post.titleAr : post.title}
              </h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-white/50">
                {lang === "ar" && post.bodyAr ? post.bodyAr : post.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
