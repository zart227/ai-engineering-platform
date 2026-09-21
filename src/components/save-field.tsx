"use client";

import { useRef, useState } from "react";

type Status = "idle" | "saving" | "saved" | "failed";

export function SaveField({
  value,
  onSave,
  placeholder,
  rows = 8,
  cacheKey,
  className,
}: {
  value: string;
  onSave: (next: string) => Promise<{ ok: boolean } | void>;
  placeholder: string;
  rows?: number;
  cacheKey?: string;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | null>(null);

  function schedule(next: string) {
    setText(next);
    setStatus("saving");
    if (cacheKey && typeof window !== "undefined") {
      window.localStorage.setItem(`aep-draft:${cacheKey}`, next);
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const result = await onSave(next);
        if (result && result.ok === false) {
          setStatus("failed");
          return;
        }
        setStatus("saved");
        if (cacheKey && typeof window !== "undefined") {
          window.localStorage.removeItem(`aep-draft:${cacheKey}`);
        }
      } catch {
        setStatus("failed");
      }
    }, 600);
  }

  return (
    <div className={className}>
      <textarea
        value={text}
        onChange={(event) => schedule(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-40 w-full resize-y rounded-lg border border-input bg-card px-2.5 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {status === "saving"
          ? "Saving..."
          : status === "saved"
            ? "Saved"
            : status === "failed"
              ? "Save failed"
              : "Черновик пишется автоматически"}
      </p>
    </div>
  );
}
