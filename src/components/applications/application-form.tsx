"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { useLang } from "@/components/public/lang-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().min(7, "Please enter a valid phone number."),
  dateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Please enter your date of birth.",
  }),
  university: z.string().min(2, "Please enter your university."),
  yearOfStudy: z.string().min(1, "Please select your year of study."),
  spiritualBackground: z
    .string()
    .min(20, "Please provide a brief description (at least 20 characters)."),
  whyJoin: z
    .string()
    .min(20, "Please share a bit more (at least 20 characters)."),
  howHeard: z.string().min(1, "Please let us know how you heard about us."),
});

type FormValues = z.infer<typeof schema>;

const content = {
  en: {
    title: "Apply to Join JPC",
    subtitle:
      "Fill in the form below and we'll be in touch within a few days.",
    sections: {
      personal: "Personal Information",
      background: "Your Background",
    },
    fields: {
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      dateOfBirth: "Date of Birth",
      university: "University / College",
      yearOfStudy: "Year of Study",
      spiritualBackground: "Spiritual Background",
      spiritualBackgroundHint:
        "Tell us a bit about your faith journey — where you've come from, what you believe.",
      whyJoin: "Why do you want to join JPC?",
      whyJoinHint:
        "What are you hoping to learn, experience, or contribute?",
      howHeard: "How did you hear about us?",
      photo: "Photo (optional)",
      photoHint: "A clear headshot, max 5 MB. JPEG or PNG.",
    },
    yearOptions: [
      { value: "1st Year", label: "1st Year" },
      { value: "2nd Year", label: "2nd Year" },
      { value: "3rd Year", label: "3rd Year" },
      { value: "4th Year", label: "4th Year" },
      { value: "5th Year", label: "5th Year" },
      { value: "Graduate / Postgraduate", label: "Graduate / Postgraduate" },
    ],
    howHeardOptions: [
      { value: "Friend", label: "A friend" },
      { value: "Social Media", label: "Social media" },
      { value: "Church / Ministry", label: "Church or ministry" },
      { value: "Campus", label: "On campus" },
      { value: "Other", label: "Other" },
    ],
    placeholders: {
      fullName: "Your full name",
      email: "your@email.com",
      phone: "+20 1xx xxx xxxx",
      university: "e.g. Cairo University",
      spiritualBackground: "Share your faith journey…",
      whyJoin: "What draws you to JPC?",
    },
    submit: "Submit Application",
    submitting: "Submitting…",
    success: {
      title: "Application Received!",
      body: "Thank you for applying. Our team will review your application and get back to you soon.",
    },
    error: "Something went wrong. Please try again.",
    duplicate:
      "An application with this email already exists. Please check your inbox.",
  },
  ar: {
    title: "قدِّم للانضمام إلى JPC",
    subtitle: "املأ النموذج أدناه وسنتواصل معك في غضون أيام قليلة.",
    sections: {
      personal: "المعلومات الشخصية",
      background: "خلفيتك",
    },
    fields: {
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      dateOfBirth: "تاريخ الميلاد",
      university: "الجامعة / الكلية",
      yearOfStudy: "السنة الدراسية",
      spiritualBackground: "الخلفية الروحية",
      spiritualBackgroundHint:
        "أخبرنا قليلاً عن رحلة إيمانك — من أين أتيت وما تؤمن به.",
      whyJoin: "لماذا تريد الانضمام إلى JPC؟",
      whyJoinHint: "ما الذي تأمل أن تتعلمه أو تختبره أو تساهم به؟",
      howHeard: "كيف سمعت عنّا؟",
      photo: "صورة شخصية (اختياري)",
      photoHint: "صورة واضحة للوجه، بحد أقصى 5 ميجابايت. JPEG أو PNG.",
    },
    yearOptions: [
      { value: "1st Year", label: "السنة الأولى" },
      { value: "2nd Year", label: "السنة الثانية" },
      { value: "3rd Year", label: "السنة الثالثة" },
      { value: "4th Year", label: "السنة الرابعة" },
      { value: "5th Year", label: "السنة الخامسة" },
      { value: "Graduate / Postgraduate", label: "دراسات عليا" },
    ],
    howHeardOptions: [
      { value: "Friend", label: "صديق" },
      { value: "Social Media", label: "وسائل التواصل الاجتماعي" },
      { value: "Church / Ministry", label: "كنيسة أو خدمة" },
      { value: "Campus", label: "الحرم الجامعي" },
      { value: "Other", label: "أخرى" },
    ],
    placeholders: {
      fullName: "اسمك الكامل",
      email: "بريدك@الإلكتروني.com",
      phone: "+20 1xx xxx xxxx",
      university: "مثال: جامعة القاهرة",
      spiritualBackground: "شارك رحلتك الإيمانية…",
      whyJoin: "ما الذي يجذبك إلى JPC؟",
    },
    submit: "إرسال الطلب",
    submitting: "جارٍ الإرسال…",
    success: {
      title: "تم استلام طلبك!",
      body: "شكراً لتقديمك. سيراجع فريقنا طلبك ويتواصل معك قريباً.",
    },
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    duplicate:
      "يوجد طلب مسبق بهذا البريد الإلكتروني. يُرجى مراجعة بريدك الوارد.",
  },
} as const;

export function ApplicationForm() {
  const { lang } = useLang();
  const t = content[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    if (photoFile) fd.append("photo", photoFile);

    try {
      const res = await fetch("/api/applications", { method: "POST", body: fd });
      if (res.status === 409) {
        setServerError(t.duplicate);
        return;
      }
      if (!res.ok) {
        setServerError(t.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError(t.error);
    }
  }

  if (submitted) {
    return (
      <div
        dir={dir}
        className="mx-auto max-w-xl rounded-2xl border border-brand-teal-500/30 bg-brand-teal-500/10 p-10 text-center"
      >
        <CheckCircle2 className="mx-auto mb-4 size-12 text-brand-teal-400" />
        <h2 className="mb-3 text-2xl font-bold text-white">{t.success.title}</h2>
        <p className="text-white/60">{t.success.body}</p>
      </div>
    );
  }

  return (
    <div dir={dir} className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Personal Information */}
        <section className="rounded-2xl border border-white/10 bg-brand-navy-900/60 p-6 md:p-8">
          <h2 className="mb-6 text-lg font-semibold text-white">
            {t.sections.personal}
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label={t.fields.fullName}
              error={errors.fullName?.message}
              required
            >
              <Input
                {...register("fullName")}
                placeholder={t.placeholders.fullName}
                aria-invalid={!!errors.fullName}
                className="bg-brand-navy-950/60 border-white/20 text-white placeholder:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.email}
              error={errors.email?.message}
              required
            >
              <Input
                {...register("email")}
                type="email"
                placeholder={t.placeholders.email}
                aria-invalid={!!errors.email}
                className="bg-brand-navy-950/60 border-white/20 text-white placeholder:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.phone}
              error={errors.phone?.message}
              required
            >
              <Input
                {...register("phone")}
                type="tel"
                placeholder={t.placeholders.phone}
                aria-invalid={!!errors.phone}
                className="bg-brand-navy-950/60 border-white/20 text-white placeholder:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.dateOfBirth}
              error={errors.dateOfBirth?.message}
              required
            >
              <Input
                {...register("dateOfBirth")}
                type="date"
                aria-invalid={!!errors.dateOfBirth}
                className="bg-brand-navy-950/60 border-white/20 text-white [color-scheme:dark] focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.university}
              error={errors.university?.message}
              required
            >
              <Input
                {...register("university")}
                placeholder={t.placeholders.university}
                aria-invalid={!!errors.university}
                className="bg-brand-navy-950/60 border-white/20 text-white placeholder:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.yearOfStudy}
              error={errors.yearOfStudy?.message}
              required
            >
              <Controller
                name="yearOfStudy"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      aria-invalid={!!errors.yearOfStudy}
                      className="bg-brand-navy-950/60 border-white/20 text-white data-[placeholder]:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
                    >
                      <SelectValue
                        placeholder={
                          lang === "ar" ? "اختر السنة" : "Select year"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {t.yearOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
        </section>

        {/* Background */}
        <section className="rounded-2xl border border-white/10 bg-brand-navy-900/60 p-6 md:p-8">
          <h2 className="mb-6 text-lg font-semibold text-white">
            {t.sections.background}
          </h2>
          <div className="space-y-5">
            <FormField
              label={t.fields.spiritualBackground}
              description={t.fields.spiritualBackgroundHint}
              error={errors.spiritualBackground?.message}
              required
            >
              <Textarea
                {...register("spiritualBackground")}
                rows={4}
                placeholder={t.placeholders.spiritualBackground}
                aria-invalid={!!errors.spiritualBackground}
                className="bg-brand-navy-950/60 border-white/20 text-white placeholder:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.whyJoin}
              description={t.fields.whyJoinHint}
              error={errors.whyJoin?.message}
              required
            >
              <Textarea
                {...register("whyJoin")}
                rows={4}
                placeholder={t.placeholders.whyJoin}
                aria-invalid={!!errors.whyJoin}
                className="bg-brand-navy-950/60 border-white/20 text-white placeholder:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
              />
            </FormField>

            <FormField
              label={t.fields.howHeard}
              error={errors.howHeard?.message}
              required
            >
              <Controller
                name="howHeard"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      aria-invalid={!!errors.howHeard}
                      className="bg-brand-navy-950/60 border-white/20 text-white data-[placeholder]:text-white/30 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30"
                    >
                      <SelectValue
                        placeholder={
                          lang === "ar"
                            ? "اختر خياراً"
                            : "Select an option"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {t.howHeardOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label={t.fields.photo}
              description={t.fields.photoHint}
            >
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-white/20 bg-brand-navy-950/60 px-3 py-2 text-sm text-white/70 file:mr-3 file:rounded file:border-0 file:bg-brand-teal-500/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-brand-teal-300 hover:file:bg-brand-teal-500/30"
              />
            </FormField>
          </div>
        </section>

        {serverError && (
          <p className="rounded-xl border border-error-500/30 bg-error-500/10 px-5 py-3.5 text-sm text-error-300">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-brand-teal-500 text-base font-semibold text-white hover:bg-brand-teal-400 disabled:opacity-60"
        >
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </form>
    </div>
  );
}
