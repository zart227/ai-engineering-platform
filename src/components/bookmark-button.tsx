"use client";

import { useState } from "react";
import { toggleBookmarkAction } from "@/app/actions/learn";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  targetType,
  targetId,
  title,
  href,
  initial,
}: {
  targetType: string;
  targetId: string;
  title: string;
  href: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={async () => {
        const result = await toggleBookmarkAction({ targetType, targetId, title, href });
        if (result.ok) setOn(result.on);
      }}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs",
        on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {on ? "В закладках" : "В закладки"}
    </button>
  );
}
