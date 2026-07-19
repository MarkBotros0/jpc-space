"use client";

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentListRow } from "@/lib/students-query";

interface StudentsListProps {
  rows: StudentListRow[];
  basePath: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

type SortKey = "name" | "university" | "season" | "group";

function initialsFor(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
  }
  return email[0]?.toUpperCase() ?? "?";
}

function sortValue(row: StudentListRow, key: SortKey): string {
  switch (key) {
    case "name":
      return (row.name ?? row.email).toLowerCase();
    case "university":
      return (row.university ?? "").toLowerCase();
    case "season":
      return (row.activeSeasonTitle ?? "").toLowerCase();
    case "group":
      return (row.groupName ?? "").toLowerCase();
  }
}

export function StudentsList({
  rows,
  basePath,
  emptyTitle = "No students yet",
  emptyDescription = "Students will appear here once they're enrolled.",
  emptyAction,
}: StudentsListProps) {
  const [season, setSeason] = React.useState("all");
  const [group, setGroup] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const seasons = React.useMemo(
    () => [...new Set(rows.map((r) => r.activeSeasonTitle).filter((s): s is string => Boolean(s)))].sort(),
    [rows],
  );
  const groups = React.useMemo(
    () => [...new Set(rows.map((r) => r.groupName).filter((g): g is string => Boolean(g)))].sort(),
    [rows],
  );

  const seasonItems: Record<string, string> = {
    all: "All seasons",
    ...Object.fromEntries(seasons.map((s) => [s, s])),
  };
  const groupItems: Record<string, string> = {
    all: "All groups",
    none: "Unassigned",
    ...Object.fromEntries(groups.map((g) => [g, g])),
  };
  const sortItems: Record<SortKey, string> = {
    name: "Sort: Name",
    university: "Sort: University",
    season: "Sort: Season",
    group: "Sort: Group",
  };

  const visible = rows
    .filter((r) => {
      if (season !== "all" && (r.activeSeasonTitle ?? "") !== season) return false;
      if (group === "none") return !r.groupName;
      if (group !== "all" && (r.groupName ?? "") !== group) return false;
      return true;
    })
    .sort((a, b) => {
      const cmp = sortValue(a, sortKey).localeCompare(sortValue(b, sortKey));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const columns: DataTableColumn<StudentListRow>[] = [
    {
      key: "name",
      header: "Student",
      cell: (row) => (
        <Link href={`${basePath}/${row.id}`} className="inline-flex items-center gap-2 hover:underline">
          <Avatar className="size-8">
            {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt={row.name ?? row.email} />}
            <AvatarFallback>{initialsFor(row.name, row.email)}</AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="font-medium">{row.name ?? row.email}</span>
            <span className="text-xs text-muted-foreground">{row.email}</span>
          </span>
        </Link>
      ),
    },
    {
      key: "university",
      header: "University",
      cell: (row) =>
        row.university ? (
          <span className="text-sm">
            {row.university}
            {row.year && <span className="text-muted-foreground"> · {row.year}</span>}
          </span>
        ) : (
          <span className="text-sm italic text-muted-foreground">—</span>
        ),
    },
    {
      key: "season",
      header: "Season",
      cell: (row) =>
        row.activeSeasonTitle ? (
          <Badge variant="outline">{row.activeSeasonTitle}</Badge>
        ) : (
          <span className="text-sm italic text-muted-foreground">—</span>
        ),
    },
    {
      key: "group",
      header: "Group",
      cell: (row) =>
        row.groupName ? (
          <Badge variant="secondary">{row.groupName}</Badge>
        ) : (
          <span className="text-sm italic text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select items={seasonItems} value={season} onValueChange={(v) => setSeason(v as string)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All seasons</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select items={groupItems} value={group} onValueChange={(v) => setGroup(v as string)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            <SelectItem value="none">Unassigned</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select items={sortItems} value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="university">Sort: University</SelectItem>
            <SelectItem value="season">Sort: Season</SelectItem>
            <SelectItem value="group">Sort: Group</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          aria-label="Toggle sort direction"
        >
          {sortDir === "asc" ? "↑ A–Z" : "↓ Z–A"}
        </Button>

        <span className="ml-auto self-center text-xs text-muted-foreground tabular-nums">
          {visible.length} of {rows.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={visible}
        rowKey={(r) => r.id}
        emptyState={
          <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} action={emptyAction} />
        }
      />
    </div>
  );
}
