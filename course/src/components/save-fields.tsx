"use client";

import { Check } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
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
    <button
      type="button"
      onClick={() => setDone(id, !checked)}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-left",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background"
        )}
        aria-hidden
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
      <span className={cn("text-sm leading-6", checked && "text-muted-foreground")}>
        {children}
      </span>
    </button>
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
