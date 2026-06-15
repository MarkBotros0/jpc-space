import type { Metadata } from "next";
import { ApplicationForm } from "@/components/applications/application-form";

export const metadata: Metadata = {
  title: "Apply — JPC Space",
  description:
    "Apply to join The Way discipleship season at the Jesus Project Community.",
};

export default function ApplyPage() {
  return (
    <section className="min-h-screen px-4 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <span className="mb-4 inline-block rounded-full bg-brand-teal-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-teal-300">
          Applications Open
        </span>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Apply to Join JPC
        </h1>
        <p className="text-lg text-white/50">
          Fill in the form below and our team will be in touch within a few days.
        </p>
      </div>

      <ApplicationForm />
    </section>
  );
}
