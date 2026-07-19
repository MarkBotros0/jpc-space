"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { CalendarDays, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteJpcEventAction } from "@/lib/jpc-event-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { JpcEventRow } from "@/lib/jpc-events-query";
import { JpcEventForm } from "./jpc-event-form";

function hasTime(d: Date): boolean {
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

function formatOne(d: Date): string {
  return format(d, hasTime(d) ? "EEE, MMM d, yyyy · h:mm a" : "EEE, MMM d, yyyy");
}

function formatEventWhen(start: Date, end: Date | null): string {
  if (!end) return formatOne(start);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) {
    return hasTime(start) || hasTime(end)
      ? `${format(start, "EEE, MMM d, yyyy · h:mm a")} – ${format(end, "h:mm a")}`
      : formatOne(start);
  }
  return `${formatOne(start)} – ${formatOne(end)}`;
}

interface JpcEventManagerClientProps {
  events: JpcEventRow[];
}

export function JpcEventManagerClient({ events: initialEvents }: JpcEventManagerClientProps) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [confirmId, setConfirmId] = React.useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    await deleteJpcEventAction(id);
    router.refresh();
    setDeletingId(null);
    setConfirmId(null);
  }

  if (creating) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
        <h2 className="text-base font-semibold mb-4">New JPC event</h2>
        <JpcEventForm onDone={() => setCreating(false)} />
      </div>
    );
  }

  if (editingId !== null) {
    const event = initialEvents.find((e) => e.id === editingId);
    return (
      <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
        <h2 className="text-base font-semibold mb-4">Edit event</h2>
        <JpcEventForm event={event} onDone={() => setEditingId(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4 mr-1.5" />
          New event
        </Button>
      </div>

      {initialEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No JPC events yet"
          description="Create an event to share with all members or alumni."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {initialEvents.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            >
              {e.imageUrl && (
                <Image
                  src={e.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold truncate">{e.title}</span>
                  <Badge variant={e.visibility === "ALUMNI_ONLY" ? "warning" : "outline"}>
                    {e.visibility === "ALUMNI_ONLY" ? "Alumni only" : "Everyone"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatEventWhen(e.date, e.endDate)}
                </p>
                {e.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                )}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-teal-500 hover:underline truncate"
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    {e.url}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(e.id)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmId(e.id)}
                  disabled={deletingId === e.id}
                >
                  <Trash2 className="size-3.5 text-error-500" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        title="Delete event?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={deletingId !== null}
        onConfirm={() => { if (confirmId !== null) void handleDelete(confirmId); }}
      />
    </div>
  );
}
