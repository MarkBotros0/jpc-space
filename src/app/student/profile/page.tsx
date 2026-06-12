import { redirect } from "next/navigation";
import { Flame } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUserOrRedirect } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { StudentForm } from "@/components/students/student-form";
import { AvatarUpload } from "@/components/students/avatar-upload";
import { StatCard } from "@/components/students/stat-card";
import { computeEngagementForStudent, computeAttendanceBudget, computeAttendanceStreak } from "@/lib/engagement";

export const metadata = { title: "My profile" };

function initialsFor(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
  }
  return email[0]?.toUpperCase() ?? "?";
}

export default async function StudentProfilePage() {
  const user = await getCurrentUserOrRedirect();
  requireRole(user, ["STUDENT"]);

  const userRow = await db.user.findUnique({
    where: { id: user.userId },
    select: {
      name: true,
      email: true,
      avatarPath: true,
      studentProfile: {
        select: {
          university: true,
          year: true,
          phone: true,
          dateOfBirth: true,
          spiritualBackground: true,
          gifts: true,
          activeSeasonId: true,
        },
      },
    },
  });
  if (!userRow || !userRow.studentProfile) redirect("/student/dashboard");

  const storage = getStorage();
  const avatarUrl = userRow.avatarPath ? await storage.url(userRow.avatarPath) : null;
  const initials = initialsFor(userRow.name, userRow.email);

  const [engagement, budget, streak] = userRow.studentProfile.activeSeasonId
    ? await Promise.all([
        computeEngagementForStudent(user.userId, userRow.studentProfile.activeSeasonId),
        computeAttendanceBudget(user.userId, userRow.studentProfile.activeSeasonId),
        computeAttendanceStreak(user.userId, userRow.studentProfile.activeSeasonId),
      ])
    : ([null, null, 0] as const);

  const attendancePct = budget
    ? Math.max(0, Math.round(100 - budget.budgetPct))
    : null;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Identity hero */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <AvatarUpload currentAvatarUrl={avatarUrl} initials={initials} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-black text-brand-navy-900 dark:text-foreground">
              {userRow.name ?? userRow.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userRow.email}</p>
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
            value={
              streak > 0 ? (
                <span className="flex items-center gap-1">
                  <Flame className="size-6 text-warning-500" aria-hidden />
                  {streak}
                </span>
              ) : (
                streak
              )
            }
          />
        </div>
      )}

      {/* Profile form */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
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
}
