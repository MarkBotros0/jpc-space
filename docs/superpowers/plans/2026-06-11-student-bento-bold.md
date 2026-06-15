# Student Portal — Bento Bold UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every `/student/*` page with the Bento Bold visual system — navy-gradient hero cards, white bento tiles, teal accent chips, big bold stats — light mode only, no data/logic changes.

**Architecture:** Visual layer only. All existing db queries, server actions, and auth checks are preserved exactly. New shared components (`StatCard`, `StudentQuickNav`) live in `src/components/students/`. The student layout gains a full-bleed `bg-brand-navy-50` wrapper. `PageHeader` is retired from student pages in favour of an inline `<h1>` + `<Badge>` chip pattern.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, existing `src/components/ui/` primitives (Card, Badge, Progress, EmptyState). No new dependencies.

---

## File Map

**New files:**
- `src/components/students/stat-card.tsx` — bento stat tile (label + big number, 3 variants)
- `src/components/students/student-quick-nav.tsx` — 4-icon quick-nav strip

**Modified files:**
- `src/app/student/layout.tsx` — bg-brand-navy-50 full-bleed wrapper
- `src/components/ui/badge.tsx` — add `teal` variant
- `src/app/student/dashboard/page.tsx` — full bento rebuild
- `src/app/student/assignments/page.tsx` — bento rebuild
- `src/app/student/assignments/[id]/page.tsx` — replace PageHeader, bento card wrappers
- `src/app/student/calendar/page.tsx` — replace PageHeader
- `src/app/student/sessions/[id]/page.tsx` — replace PageHeader, bento card
- `src/app/student/history/page.tsx` — replace PageHeader, bento card styling
- `src/app/student/profile/page.tsx` — navy hero card + stats strip
- `src/app/student/season/page.tsx` — navy hero card, bento cards

---

## Task 1: Branch + student layout background

**Files:**
- Modify: `src/app/student/layout.tsx`

- [ ] **Step 1: Create feature branch**

```bash
git checkout main && git pull origin main
git checkout -b feat/student-bento-bold
```

- [ ] **Step 2: Update the student layout**

Replace the entire content of `src/app/student/layout.tsx` with:

```tsx
import type { ReactNode } from "react";

import { RoleLayout } from "@/components/layout/role-layout";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout allowedRoles={["STUDENT"]}>
      {/*
        Negative margins cancel ShellFrame's main padding so bg-brand-navy-50
        covers the full content area including the padded edges.
        Matching positive padding restores the inner spacing.
        pb-24 / md:pb-10 match ShellFrame's bottom padding for the mobile tab bar.
      */}
      <div className="-mx-4 -mt-4 bg-brand-navy-50 px-4 pt-4 pb-24 md:-mx-8 md:-mt-8 md:px-8 md:pt-8 md:pb-10">
        {children}
      </div>
    </RoleLayout>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: no errors (this is a trivial change).

- [ ] **Step 4: Commit**

```bash
git add src/app/student/layout.tsx
git commit -m "feat(student): full-bleed brand-navy-50 background for student layout"
```

---

## Task 2: Badge — add `teal` variant

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Add `teal` to the variant map**

In `src/components/ui/badge.tsx`, find the `variants` object inside `cva(...)` and add `teal` after `info`:

```tsx
        info: "bg-info-100 text-info-800",
        teal: "bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200",
```

The full `variants.variant` block should now read:

```tsx
      variant: {
        default: "bg-muted text-muted-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        error: "bg-error-100 text-error-800",
        info: "bg-info-100 text-info-800",
        teal: "bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200",
      },
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(ui): add teal variant to Badge"
```

---

## Task 3: StatCard component

**Files:**
- Create: `src/components/students/stat-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  variant?: "white" | "navy" | "teal";
  className?: string;
}

export function StatCard({
  label,
  value,
  variant = "white",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        variant === "white" &&
          "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60",
        variant === "navy" &&
          "bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 shadow-[0_4px_20px_rgba(31,50,96,0.25)]",
        variant === "teal" &&
          "bg-brand-teal-100 ring-1 ring-brand-teal-200",
        className,
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest",
          variant === "white" && "text-neutral-400",
          variant === "navy" && "text-brand-teal-300",
          variant === "teal" && "text-brand-teal-700",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-black",
          variant === "white" && "text-brand-navy-900",
          variant === "navy" && "text-white",
          variant === "teal" && "text-brand-teal-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/students/stat-card.tsx
git commit -m "feat(students): add StatCard bento tile component"
```

---

## Task 4: StudentQuickNav component

**Files:**
- Create: `src/components/students/student-quick-nav.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";
import { Calendar, FileText, Sparkles, User } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/student/calendar", icon: Calendar, label: "Calendar" },
  { href: "/student/assignments", icon: FileText, label: "Assignments" },
  { href: "/student/history", icon: Sparkles, label: "History" },
  { href: "/student/profile", icon: User, label: "Profile" },
] as const;

export function StudentQuickNav({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {NAV_LINKS.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-3 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60 transition-shadow duration-150 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-navy-50 text-brand-navy-700">
            <Icon className="size-4" />
          </span>
          <span className="text-xs font-semibold text-brand-navy-900">{label}</span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/students/student-quick-nav.tsx
git commit -m "feat(students): add StudentQuickNav 4-icon strip"
```

---

## Task 5: Dashboard page

**Files:**
- Modify: `src/app/student/dashboard/page.tsx`

- [ ] **Step 1: Replace the full file**

```tsx
import Link from "next/link";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { Sparkles } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { computeEngagementForStudent, computeAttendanceBudget } from "@/lib/engagement";
import { listAssignmentsForStudent } from "@/lib/assignments-query";
import { StaggerReveal } from "@/components/motion/stagger-reveal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/students/stat-card";
import { StudentQuickNav } from "@/components/students/student-quick-nav";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const profile = await db.user.findUnique({
    where: { id: user.userId },
    select: {
      name: true,
      studentProfile: {
        select: {
          activeSeason: {
            select: { id: true, title: true, code: true },
          },
        },
      },
    },
  });

  const seasonId = user.activeSeasonId;
  const season = profile?.studentProfile?.activeSeason ?? null;

  const [engagement, nextSession, assignments, budget] = seasonId
    ? await Promise.all([
        computeEngagementForStudent(user.userId, seasonId),
        db.session.findFirst({
          where: { seasonId, startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            title: true,
            startsAt: true,
            location: true,
            durationMinutes: true,
          },
        }),
        listAssignmentsForStudent(user.userId, seasonId),
        computeAttendanceBudget(user.userId, seasonId),
      ])
    : ([null, null, [], null] as const);

  const pending = assignments.filter(
    (a) => a.status === "PENDING" || a.status === "DRAFT",
  );

  let weeksCompleted = 0;
  let weeksTotal = 0;
  if (seasonId) {
    weeksTotal = await db.session.count({ where: { seasonId } });
    weeksCompleted = await db.session.count({
      where: { seasonId, startsAt: { lte: new Date() } },
    });
  }

  const progressPct =
    weeksTotal > 0 ? Math.round((weeksCompleted / weeksTotal) * 100) : 0;
  const attendancePct = budget
    ? Math.max(0, Math.round(100 - budget.budgetPct))
    : null;
  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <StaggerReveal className="flex flex-col gap-3 md:gap-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900">
          Hi, {firstName} 👋
        </h1>
        {season ? (
          <Badge variant="teal" className="mt-1.5">
            {season.title}
          </Badge>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">Welcome to JPC Space</p>
        )}
      </div>

      {/* ── Not enrolled ── */}
      {!season && (
        <>
          <EmptyState
            icon={Sparkles}
            title="Not enrolled yet"
            description="Contact your leader or admin to be enrolled in a season."
          />
          <div className="rounded-xl bg-brand-teal-100 p-4 ring-1 ring-brand-teal-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-700">
              While you wait
            </p>
            <Link
              href="/student/profile"
              className="mt-1 block text-sm font-bold text-brand-teal-900 hover:underline"
            >
              Complete your profile →
            </Link>
          </div>
        </>
      )}

      {/* ── Active season ── */}
      {season && (
        <>
          {/* Hero progress card */}
          <div className="rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 p-4 shadow-[0_4px_20px_rgba(31,50,96,0.25)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal-300">
              Season progress
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-black text-white">{progressPct}%</p>
                <p className="text-xs text-white/50">
                  Week {weeksCompleted} of {weeksTotal}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-white">
                  {engagement?.submissionsCompleted ?? 0}
                  <span className="text-sm font-semibold text-white/40">
                    /{engagement?.submissionsExpected ?? 0}
                  </span>
                </p>
                <p className="text-xs text-white/50">assignments</p>
              </div>
            </div>
            <Progress
              value={progressPct}
              className="mt-3 h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-brand-teal-400 [&>div]:to-brand-teal-300"
            />
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Attendance"
              value={attendancePct !== null ? `${attendancePct}%` : "—"}
            />
            <StatCard
              label="Streak"
              value={`🔥 ${engagement?.submissionsCompleted ?? 0}`}
            />
            <StatCard
              label="Pending"
              value={pending.length}
              variant={pending.length > 0 ? "teal" : "white"}
            />
          </div>

          {/* Next session */}
          <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Next session
            </p>
            {nextSession ? (
              <div className="mt-2 flex items-start gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-teal-500" />
                <div>
                  <p className="text-sm font-bold text-brand-navy-900">
                    {nextSession.title}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {format(nextSession.startsAt, "EEE, MMM d · h:mm a")} ·{" "}
                    {nextSession.durationMinutes} min
                    {nextSession.location ? ` · ${nextSession.location}` : ""}
                  </p>
                  <Badge variant="teal" className="mt-1.5 text-[10px]">
                    {formatDistanceToNowStrict(nextSession.startsAt, {
                      addSuffix: true,
                    })}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-neutral-400">
                No upcoming sessions.
              </p>
            )}
          </div>

          {/* Due soon */}
          {pending.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Due soon
                </p>
                <Link
                  href="/student/assignments"
                  className="text-xs font-semibold text-brand-teal-700 hover:underline"
                >
                  See all
                </Link>
              </div>
              <ul className="mt-2 flex flex-col divide-y divide-neutral-100">
                {pending.slice(0, 3).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/student/assignments/${a.id}`}
                      className="flex-1 truncate text-sm font-semibold text-brand-navy-900 hover:underline"
                    >
                      {a.title}
                    </Link>
                    {a.dueAt && (
                      <Badge
                        variant={isPast(a.dueAt) ? "error" : "warning"}
                        className="shrink-0 text-[10px]"
                      >
                        {isPast(a.dueAt)
                          ? "Past due"
                          : `Due in ${formatDistanceToNowStrict(a.dueAt)}`}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick nav */}
          <StudentQuickNav />
        </>
      )}
    </StaggerReveal>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/student/dashboard/page.tsx
git commit -m "feat(student): rebuild dashboard with Bento Bold layout"
```

---

## Task 6: Assignments list page

**Files:**
- Modify: `src/app/student/assignments/page.tsx`

- [ ] **Step 1: Replace the full file**

```tsx
import Link from "next/link";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { FileText } from "lucide-react";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { listAssignmentsForStudent } from "@/lib/assignments-query";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/students/stat-card";
import type { SubmissionStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Assignments" };

type RowStatus = SubmissionStatus | "PENDING";

function statusDot(status: RowStatus, dueAt: Date | null): string {
  if (status === "REVIEWED") return "bg-success-500";
  if (status === "SUBMITTED") return "bg-brand-teal-500";
  if (status === "DRAFT") return "bg-warning-500";
  if (dueAt && isPast(dueAt)) return "bg-error-500";
  return "bg-neutral-300";
}

function StatusBadge({
  status,
  dueAt,
}: {
  status: RowStatus;
  dueAt: Date | null;
}) {
  if (status === "REVIEWED")
    return <Badge variant="success">Reviewed</Badge>;
  if (status === "SUBMITTED")
    return <Badge variant="teal">Submitted</Badge>;
  if (status === "DRAFT")
    return <Badge variant="warning">Draft</Badge>;
  if (dueAt && isPast(dueAt))
    return <Badge variant="error">Past due</Badge>;
  return <Badge variant="outline">Not started</Badge>;
}

export default async function StudentAssignmentsPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const rows = await listAssignmentsForStudent(user.userId, user.activeSeasonId);

  const submitted = rows.filter(
    (r) => r.status === "SUBMITTED" || r.status === "REVIEWED",
  ).length;
  const pending = rows.filter(
    (r) => r.status === "PENDING" || r.status === "DRAFT",
  ).length;
  const reviewed = rows.filter((r) => r.status === "REVIEWED").length;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900">Assignments</h1>
        <p className="mt-1 text-sm text-neutral-500">Your current season</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Check back when your leader posts one."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Submitted" value={submitted} />
            <StatCard
              label="Pending"
              value={pending}
              variant={pending > 0 ? "teal" : "white"}
            />
            <StatCard label="Reviewed" value={reviewed} />
          </div>

          <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <ul className="divide-y divide-neutral-100">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3 first:pt-4 last:pb-4"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${statusDot(r.status as RowStatus, r.dueAt)}`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      href={`/student/assignments/${r.id}`}
                      className="truncate text-sm font-semibold text-brand-navy-900 hover:underline"
                    >
                      {r.title}
                    </Link>
                    {r.dueAt && (
                      <p className="text-xs text-neutral-500">
                        {isPast(r.dueAt) ? "Was due" : "Due"}{" "}
                        {format(r.dueAt, "MMM d, yyyy")}
                        {!isPast(r.dueAt) &&
                          ` · in ${formatDistanceToNowStrict(r.dueAt)}`}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    status={r.status as RowStatus}
                    dueAt={r.dueAt}
                  />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

Expected: no errors. If `r.status` type doesn't match `RowStatus`, cast explicitly as shown with `r.status as RowStatus`.

- [ ] **Step 3: Commit**

```bash
git add src/app/student/assignments/page.tsx
git commit -m "feat(student): rebuild assignments list with Bento Bold layout"
```

---

## Task 7: Assignment detail page

**Files:**
- Modify: `src/app/student/assignments/[id]/page.tsx`

- [ ] **Step 1: Replace the JSX return, keep all data fetching unchanged**

All imports and data fetching stay the same. Only change the `return (...)` block. Remove the `PageHeader` import and add `Badge` import if not already present.

Replace the imports block at the top to remove `PageHeader` and add `Badge`:

```tsx
import { redirect } from "next/navigation";
import { format, isPast, formatDistanceToNowStrict } from "date-fns";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { ensureDraftSubmission } from "@/lib/assignment-actions";
import { loadAssignmentById } from "@/lib/assignments-query";
import { Badge } from "@/components/ui/badge";
import { RichTextView } from "@/components/ui/rich-text-view";
import { StudentSubmissionForm } from "@/components/assignments/student-submission-form";
```

Replace the `return (...)` block with:

```tsx
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div>
        <Link
          href="/student/assignments"
          className="text-xs font-semibold text-brand-teal-700 hover:underline"
        >
          ← Assignments
        </Link>
        <h1 className="mt-1 text-2xl font-black text-brand-navy-900">
          {assignment.title}
        </h1>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {assignment.dueAt && (
            <Badge
              variant={isPast(assignment.dueAt) ? "error" : "warning"}
            >
              {isPast(assignment.dueAt)
                ? "Past due"
                : `Due in ${formatDistanceToNowStrict(assignment.dueAt)}`}
            </Badge>
          )}
          {!assignment.dueAt && (
            <Badge variant="outline">No due date</Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {assignment.description && (
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Brief
          </p>
          <RichTextView html={assignment.description} />
        </div>
      )}

      {/* Submission form — unchanged component */}
      <StudentSubmissionForm
        submissionId={submission.id}
        status={submission.status}
        initialText={submission.text ?? ""}
        initialFiles={submission.files}
        feedback={submission.feedback}
        dueAt={assignment.dueAt}
        acceptsFiles={assignment.maxFileSizeMb != null}
        maxFileSizeMb={assignment.maxFileSizeMb}
        allowedMimeCategories={assignment.allowedMimeCategories}
      />
    </div>
  );
```

Also add `Link` import at the top (it was already there via `redirect` context — add it explicitly):

```tsx
import Link from "next/link";
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/student/assignments/[id]/page.tsx
git commit -m "feat(student): rebuild assignment detail with Bento Bold layout"
```

---

## Task 8: Calendar page

**Files:**
- Modify: `src/app/student/calendar/page.tsx`

- [ ] **Step 1: Replace the file — data fetching unchanged, only JSX updated**

```tsx
import { Calendar } from "lucide-react";

import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { listSessionsForSeason } from "@/lib/sessions-query";
import { listJpcEvents } from "@/lib/jpc-events-query";
import { SeasonCalendar } from "@/components/sessions/season-calendar";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Calendar" };

export default async function StudentCalendarPage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  if (!user.activeSeasonId) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <h1 className="text-2xl font-black text-brand-navy-900">Calendar</h1>
        <EmptyState
          icon={Calendar}
          title="No active season"
          description="An admin will enroll you in a season when you're ready."
        />
      </div>
    );
  }

  const [sessions, jpcEvents] = await Promise.all([
    listSessionsForSeason(user.activeSeasonId),
    listJpcEvents({ includeAlumniOnly: false }),
  ]);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <h1 className="text-2xl font-black text-brand-navy-900">Calendar</h1>
      <SeasonCalendar
        sessions={sessions}
        jpcEvents={jpcEvents}
        sessionPathTemplate="/student/sessions/{id}"
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/app/student/calendar/page.tsx
git commit -m "feat(student): update calendar page header to Bento Bold"
```

---

## Task 9: Session detail page

**Files:**
- Modify: `src/app/student/sessions/[id]/page.tsx`

- [ ] **Step 1: Replace the file — all data fetching and checkin logic unchanged**

```tsx
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Clock, MapPin } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { loadSessionById } from "@/lib/sessions-query";
import { StudentCheckinButton } from "@/components/sessions/student-checkin-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Session" };

export default async function StudentSessionPage({ params }: PageProps) {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const { id } = await params;
  const session = await loadSessionById(Number(id));

  const enrollment = await db.seasonEnrollment.findFirst({
    where: { seasonId: session.seasonId, studentUserId: user.userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!enrollment) notFound();

  // eslint-disable-next-line react-hooks/purity -- Server Component: Date.now() runs once per request
  const now = Date.now();
  const isCheckInOpen =
    !!session.checkInOpenAt &&
    !session.checkInClosedAt &&
    now - session.checkInOpenAt.getTime() < 3 * 60 * 60 * 1000;

  const endsAt = new Date(
    session.startsAt.getTime() + session.durationMinutes * 60 * 1000,
  );

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div>
        <Link
          href="/student/calendar"
          className="text-xs font-semibold text-brand-teal-700 hover:underline"
        >
          ← Calendar
        </Link>
        {/* Navy hero card */}
        <div className="mt-2 rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 p-4 shadow-[0_4px_20px_rgba(31,50,96,0.25)]">
          <h1 className="text-xl font-black text-white">{session.title}</h1>
          <p className="mt-1 text-sm text-white/60">
            {format(session.startsAt, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Details
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock className="size-4 shrink-0 text-brand-teal-600" />
            <span>
              {format(session.startsAt, "h:mm a")} –{" "}
              {format(endsAt, "h:mm a")} · {session.durationMinutes} min
            </span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="size-4 shrink-0 text-brand-teal-600" />
              <span>{session.location}</span>
            </div>
          )}
        </div>
      </div>

      <StudentCheckinButton isCheckInOpen={isCheckInOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/app/student/sessions/\[id\]/page.tsx
git commit -m "feat(student): rebuild session detail with Bento Bold layout"
```

---

## Task 10: History page

**Files:**
- Modify: `src/app/student/history/page.tsx`

- [ ] **Step 1: Keep all data fetching, replace only the return block**

The data fetching queries (enrollments, attendanceByseason, curriculaBySeason) stay exactly the same. Only the JSX changes.

Find the `return (` statement and replace everything from there to end of file with:

```tsx
  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <h1 className="text-2xl font-black text-brand-navy-900">History</h1>
        <EmptyState
          icon={Sparkles}
          title="No past seasons"
          description="Once you complete a season, it'll appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div>
        <h1 className="text-2xl font-black text-brand-navy-900">History</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Seasons you&apos;ve participated in
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {enrollments.map((e) => {
          const att = attendanceByseason.get(e.seasonId) ?? {
            total: 0,
            present: 0,
          };
          const attendancePct =
            att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
          const sessions = curriculaBySeason.get(e.seasonId) ?? [];

          return (
            <li key={e.seasonId}>
              <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
                {/* Season title row */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-brand-navy-900">
                      {e.season.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {format(e.season.startDate, "MMM d, yyyy")} –{" "}
                      {format(e.season.endDate, "MMM d, yyyy")}
                      {e.group?.name && ` · ${e.group.name}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="teal">{attendancePct}% attended</Badge>
                    <Badge variant="success">Participated</Badge>
                  </div>
                </div>

                {/* Curriculum accordion */}
                {sessions.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-brand-navy-700">
                      Curriculum ({sessions.length} sessions)
                    </summary>
                    <ol className="mt-2 flex flex-col gap-1 text-neutral-500">
                      {sessions.map((s) => (
                        <li
                          key={s.id}
                          className="flex justify-between gap-3 border-t border-neutral-100 pt-1 first:border-0 first:pt-0"
                        >
                          <span>{s.title}</span>
                          <span className="shrink-0 text-xs tabular-nums">
                            {format(s.startsAt, "MMM d, yyyy")}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

Also remove the `PageHeader` import and add `Badge` if missing. The `Sparkles` and `EmptyState` imports should stay.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/app/student/history/page.tsx
git commit -m "feat(student): rebuild history page with Bento Bold layout"
```

---

## Task 11: Profile page

**Files:**
- Modify: `src/app/student/profile/page.tsx`

- [ ] **Step 1: Keep all data fetching, replace the return block**

All existing imports and data fetching stay identical (`userRow` query, `storage.url`, `initialsFor`). Remove `PageHeader`, `Card`, `CardContent` imports. Add `Badge`, `StatCard` imports.

Replace imports block:

```tsx
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { StudentForm } from "@/components/students/student-form";
import { AvatarUpload } from "@/components/students/avatar-upload";
import { StatCard } from "@/components/students/stat-card";
import { computeEngagementForStudent, computeAttendanceBudget } from "@/lib/engagement";
```

After the existing `userRow` query (keep it exactly), add two new queries for stats:

```tsx
  const [engagement, budget] = userRow.studentProfile.activeSeasonId
    ? await Promise.all([
        computeEngagementForStudent(user.userId, userRow.studentProfile.activeSeasonId),
        computeAttendanceBudget(user.userId, userRow.studentProfile.activeSeasonId),
      ])
    : [null, null];

  const attendancePct = budget
    ? Math.max(0, Math.round(100 - budget.budgetPct))
    : null;
```

Replace the `return (...)` block with:

```tsx
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Navy hero card */}
      <div className="rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 p-4 shadow-[0_4px_20px_rgba(31,50,96,0.25)]">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <AvatarUpload currentAvatarUrl={avatarUrl} initials={initials} />
          </div>
          <div>
            <p className="text-xl font-black text-white">
              {userRow.name ?? userRow.email}
            </p>
            <p className="text-xs text-white/50">JPC Space Student</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="teal">Student</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {engagement && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Attendance"
            value={attendancePct !== null ? `${attendancePct}%` : "—"}
          />
          <StatCard
            label="Assignments"
            value={`${engagement.submissionsCompleted}/${engagement.submissionsExpected}`}
          />
          <StatCard
            label="Streak"
            value={`🔥 ${engagement.submissionsCompleted}`}
          />
        </div>
      )}

      {/* Profile form */}
      <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Your details
        </p>
        <StudentForm
          mode="edit"
          studentUserId={user.userId}
          isSelf
          seasons={[]}
          redirectTo="/student/profile"
          defaultValues={{
            name: userRow.name ?? "",
            email: userRow.email,
            university: userRow.studentProfile.university,
            year: userRow.studentProfile.year,
            phone: userRow.studentProfile.phone,
            dateOfBirth: userRow.studentProfile.dateOfBirth,
            spiritualBackground: userRow.studentProfile.spiritualBackground,
            gifts: userRow.studentProfile.gifts,
            notes: null,
            activeSeasonId: userRow.studentProfile.activeSeasonId,
          }}
        />
      </div>
    </div>
  );
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

Expected: no errors. If `activeSeasonId` type errors appear from the new engagement queries, it's because `activeSeasonId` might be `number | null` — the ternary handles that already.

- [ ] **Step 3: Commit**

```bash
git add src/app/student/profile/page.tsx
git commit -m "feat(student): rebuild profile page with Bento Bold layout + stats strip"
```

---

## Task 12: Season page

**Files:**
- Modify: `src/app/student/season/page.tsx`

- [ ] **Step 1: Keep all data fetching, replace the return blocks**

All existing queries stay exactly the same. Remove `PageHeader`, `CardHeader`, `CardTitle` imports. The `Card`, `CardContent`, `Badge`, `Button`, `Link` imports stay.

Update the import block (remove PageHeader, CardHeader, CardTitle):

```tsx
import Link from "next/link";
import { format } from "date-fns";
import { Users } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
```

Replace the not-enrolled early-return with:

```tsx
  if (!user.activeSeasonId) {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <h1 className="text-2xl font-black text-brand-navy-900">
          Current season
        </h1>
        <EmptyState
          icon={Users}
          title="No active season"
          description="An admin will enroll you when you're ready."
        />
      </div>
    );
  }
```

Replace the main `return (...)` block (after all the queries) with:

```tsx
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Navy hero card */}
      <div className="rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-700 p-4 shadow-[0_4px_20px_rgba(31,50,96,0.25)]">
        <h1 className="text-xl font-black text-white">{season.title}</h1>
        <p className="mt-1 text-sm text-white/60">
          {format(season.startDate, "MMM d, yyyy")} –{" "}
          {format(season.endDate, "MMM d, yyyy")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="teal">{season.status}</Badge>
          {membership?.group && (
            <Badge className="bg-white/10 text-white border-white/20">
              {membership.group.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {season.description && (
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            About this season
          </p>
          <p className="text-sm text-neutral-700">{season.description}</p>
        </div>
      )}

      {/* Group card */}
      {membership?.group && (
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
            Your group — {membership.group.name}
          </p>
          {membership.group.description && (
            <p className="mb-3 text-sm text-neutral-600">
              {membership.group.description}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-bold text-neutral-400 mb-1">Leaders</p>
              <ul className="flex flex-col gap-0.5 text-sm text-brand-navy-900">
                {membership.group.leaders.map((l, i) => (
                  <li key={i}>{l.user.name ?? l.user.email}</li>
                ))}
                {membership.group.leaders.length === 0 && (
                  <li className="italic text-neutral-400">
                    No leaders assigned yet.
                  </li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 mb-1">
                Members ({membership.group.students.length})
              </p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-brand-navy-900">
                {membership.group.students.map((s) => (
                  <li key={s.studentUser.id}>{s.studentUser.name ?? "—"}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      <div className="rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Upcoming sessions
          </p>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/student/calendar" />}
            className="text-xs text-brand-teal-700"
          >
            See calendar
          </Button>
        </div>
        {upcomingSessions.length === 0 ? (
          <p className="text-sm italic text-neutral-400">
            No upcoming sessions.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-100">
            {upcomingSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-start gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-teal-500" />
                <div>
                  <p className="text-sm font-semibold text-brand-navy-900">
                    {s.title}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {format(s.startsAt, "EEE, MMM d · h:mm a")}
                    {s.location && ` · ${s.location}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/app/student/season/page.tsx
git commit -m "feat(student): rebuild season page with Bento Bold layout"
```

---

## Task 13: Final typecheck, lint, and branch push

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck 2>&1 | grep -E "error|warning" | head -20
```

Expected: no errors. Fix any that appear before continuing.

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | grep -E "error|warning" | head -20
```

Expected: no errors. Common fixes:
- Unused imports → remove them
- Missing `key` prop → add `key`
- `any` type → replace with explicit type

- [ ] **Step 3: Push branch and open PR**

```bash
git push -u origin feat/student-bento-bold
gh pr create \
  --title "feat(student): Bento Bold UI redesign" \
  --body "Rebuilds all student portal pages with the Bento Bold design system — navy hero cards, white bento tiles, teal accent chips, light-mode-only. No data or logic changes." \
  --base main
```
