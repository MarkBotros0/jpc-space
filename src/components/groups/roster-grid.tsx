"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignStudentsToGroupsAction } from "@/lib/group-actions";
import type { RosterStudent, GroupSelectOption } from "@/lib/groups-query";

interface RosterGridProps {
  seasonId: number;
  seasonCode: string;
  students: RosterStudent[];
  groups: GroupSelectOption[];
}

const NONE = "none";

export function RosterGrid({ seasonId, seasonCode, students, groups }: RosterGridProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const initial = React.useMemo(
    () => Object.fromEntries(students.map((s) => [s.userId, s.groupId])) as Record<number, number | null>,
    [students],
  );
  const [value, setValue] = React.useState<Record<number, number | null>>(initial);
  const [baseline, setBaseline] = React.useState<Record<number, number | null>>(initial);

  const groupItems: Record<string, string> = {
    [NONE]: "Unassigned",
    ...Object.fromEntries(groups.map((g) => [String(g.id), g.name])),
  };

  const changed = students.filter((s) => value[s.userId] !== baseline[s.userId]);

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No students in this season"
        description="Students appear here once their active season is set for this season (e.g. via the profile import)."
      />
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No groups yet"
        description="Create at least one group before assigning students."
        action={
          <Button render={<Link href={`/admin/season/${seasonCode}/groups/new`} />}>New group</Button>
        }
      />
    );
  }

  function setGroup(userId: number, raw: string) {
    setValue((prev) => ({ ...prev, [userId]: raw === NONE ? null : Number(raw) }));
  }

  function save() {
    if (changed.length === 0) return;
    const assignments = changed.map((s) => ({ studentUserId: s.userId, groupId: value[s.userId] }));
    startTransition(async () => {
      const res = await assignStudentsToGroupsAction(seasonId, assignments);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBaseline(value);
      toast.success(
        `Updated ${changed.length} student${changed.length === 1 ? "" : "s"}.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {changed.length === 0 ? "No unsaved changes" : `${changed.length} unsaved change${changed.length === 1 ? "" : "s"}`}
        </p>
        <Button onClick={save} disabled={pending || changed.length === 0}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {students.map((s) => {
          const current = value[s.userId];
          const dirty = current !== baseline[s.userId];
          return (
            <div
              key={s.userId}
              className={`flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between ${
                dirty ? "border-brand-teal-400" : "border-border"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{s.name ?? s.email}</p>
                <p className="truncate text-xs text-muted-foreground">{s.email}</p>
              </div>
              <Select
                items={groupItems}
                value={current === null ? NONE : String(current)}
                onValueChange={(v) => setGroup(s.userId, v as string)}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
