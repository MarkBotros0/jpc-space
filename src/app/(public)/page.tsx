import type { Metadata } from "next";
import { db } from "@/lib/db";
import { HeroSection } from "@/components/public/hero-section";
import { MissionSection } from "@/components/public/mission-section";
import { ProgramsSection } from "@/components/public/programs-section";
import { NewsSection } from "@/components/public/news-section";
import { HowToJoinSection } from "@/components/public/how-to-join-section";
import { MembersSection } from "@/components/public/members-section";
import { NewsletterForm } from "@/components/public/newsletter-form";

export const metadata: Metadata = {
  title: "JPC Space — Jesus Project Community",
  description:
    "A discipleship community for university students. Apply to join The Way season.",
};

export default async function HomePage() {
  const posts = await db.jpcPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      titleAr: true,
      body: true,
      bodyAr: true,
      publishedAt: true,
    },
  });

  return (
    <>
      <HeroSection />
      <MissionSection />
      <ProgramsSection />
      <NewsSection posts={posts} />
      <HowToJoinSection />
      <MembersSection />
      <NewsletterForm />
    </>
  );
}
