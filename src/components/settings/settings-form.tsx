"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Lock, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  changePasswordAction,
  updateNotificationPreferencesAction,
  updateOwnProfileAction,
  type NotificationPrefsInput,
} from "@/lib/settings-actions";

interface SettingsFormProps {
  initialName: string;
  email: string;
  initialPrefs: NotificationPrefsInput;
}

const PREF_LABELS: { key: keyof NotificationPrefsInput; label: string; description: string }[] = [
  {
    key: "assignmentCreated",
    label: "New assignments",
    description: "When an admin creates an assignment you're targeted by.",
  },
  {
    key: "submissionReviewed",
    label: "Submission reviewed",
    description: "When a leader leaves feedback on your submission.",
  },
  {
    key: "sessionRescheduled",
    label: "Session rescheduled",
    description: "When a session you're enrolled in moves time.",
  },
  {
    key: "lowAttendanceFlag",
    label: "Low-attendance flags",
    description: "When a student you lead/admin misses 3 in a row.",
  },
  {
    key: "mentorFollowup",
    label: "Mentor follow-ups",
    description: "When a mentor flags a note for admin follow-up.",
  },
];

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-950 dark:text-brand-teal-300">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function SettingsForm({ initialName, email, initialPrefs }: SettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState(initialName);

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pwFieldErrors, setPwFieldErrors] = React.useState<Record<string, string>>({});

  const [prefs, setPrefs] = React.useState<NotificationPrefsInput>(initialPrefs);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateOwnProfileAction(name);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Profile saved.");
        router.refresh();
      }
    });
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwFieldErrors({});
    startTransition(async () => {
      const result = await changePasswordAction(current, next, confirm);
      if (!result.ok) {
        setPwFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    });
  }

  function togglePref(key: keyof NotificationPrefsInput) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(updated);
      if (!result.ok) {
        setPrefs(prefs); // revert
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Section icon={UserRound} title="Profile" description="Your name as it appears across JPC Space.">
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <FormField label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Email" description="Change via the admin console.">
            <Input value={email} disabled />
          </FormField>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pending || name.trim() === initialName.trim()}
            >
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Section>

      <Section icon={Lock} title="Change password" description="Use at least 8 characters.">
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <FormField label="Current password" required error={pwFieldErrors.currentPassword}>
            <PasswordInput
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>
          <FormField label="New password" required error={pwFieldErrors.newPassword}>
            <PasswordInput
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Confirm new password" required error={pwFieldErrors.confirm}>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !current || !next || !confirm}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        icon={Bell}
        title="Notifications"
        description="Changes save automatically."
      >
        <ul className="flex flex-col divide-y divide-border">
          {PREF_LABELS.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{p.label}</span>
                <span className="block text-xs text-muted-foreground">{p.description}</span>
              </div>
              <Switch
                aria-label={p.label}
                checked={prefs[p.key]}
                onCheckedChange={() => togglePref(p.key)}
                className={cn(pending && "opacity-70")}
              />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
