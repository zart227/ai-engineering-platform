"use client";

import Link from "next/link";
import { weekCompletion, useProgress } from "@/components/progress-provider";
import { weeks, weekHref } from "@course";

export function WeekGrid() {
  const { state } = useProgress();

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {weeks.map((week) => {
        const percent = weekCompletion(state.done, week.slug);
        return (
          <Link
            key={week.slug}
            href={weekHref(week)}
            className="group rounded-3xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-primary/4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted-foreground">Неделя {week.id}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{percent}%</p>
            </div>
            <h3 className="mt-2 font-heading text-2xl leading-tight tracking-tight group-hover:text-primary">
              {week.short}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{week.goal}</p>
            <p className="mt-4 text-sm">
              Артефакт: {week.artifact}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
