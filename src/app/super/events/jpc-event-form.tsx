"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createJpcEventAction, updateJpcEventAction } from "@/lib/jpc-event-actions";
import type { JpcEventRow } from "@/lib/jpc-events-query";

interface JpcEventFormProps {
  event?: JpcEventRow;
  onDone: () => void;
}

export function JpcEventForm({ event, onDone }: JpcEventFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [visibility, setVisibility] = React.useState<"ALL" | "ALUMNI_ONLY">(
    event?.visibility ?? "ALL"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = event
      ? await updateJpcEventAction(event.id, fd)
      : await createJpcEventAction(fd);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      router.refresh();
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="title">Title</label>
        <Input
          id="title"
          name="title"
          defaultValue={event?.title}
          placeholder="Spring Retreat"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="date">Date</label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={event ? format(event.date, "yyyy-MM-dd") : ""}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="time">
            Time <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={
              event && (event.date.getHours() !== 0 || event.date.getMinutes() !== 0)
                ? format(event.date, "HH:mm")
                : ""
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="endDate">
            End date <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={event?.endDate ? format(event.endDate, "yyyy-MM-dd") : ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="endTime">
            End time <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={
              event?.endDate && (event.endDate.getHours() !== 0 || event.endDate.getMinutes() !== 0)
                ? format(event.endDate, "HH:mm")
                : ""
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="url">Link (optional)</label>
        <Input
          id="url"
          name="url"
          type="url"
          defaultValue={event?.url ?? ""}
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="visibility">Visibility</label>
        <Select value={visibility} onValueChange={(v) => setVisibility(v as "ALL" | "ALUMNI_ONLY")}>
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Everyone</SelectItem>
            <SelectItem value="ALUMNI_ONLY">Alumni only (leaders, admins)</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="visibility" value={visibility} />
      </div>

      {error && <p className="text-sm text-error-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
