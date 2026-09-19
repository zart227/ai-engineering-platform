"use client";

import { useProgress } from "@/components/progress-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DoneRow({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { state, setDone } = useProgress();
  const checked = Boolean(state.done[id]);

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1",
        className
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => setDone(id, Boolean(value))}
        className="mt-0.5"
      />
      <span className={cn("text-sm leading-6", checked && "text-muted-foreground")}>
        {children}
      </span>
    </label>
  );
}

export function SavedTextarea({
  id,
  placeholder,
  rows = 8,
}: {
  id: string;
  placeholder: string;
  rows?: number;
}) {
  const { state, setNote } = useProgress();

  return (
    <Textarea
      value={state.notes[id] ?? ""}
      onChange={(event) => setNote(id, event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="min-h-40 resize-y bg-card"
    />
  );
}
