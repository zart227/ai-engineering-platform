"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { courseCompletion, useProgress, weekCompletion } from "@/components/progress-provider";
import { weeks, weekHref } from "@/lib/course";

export function ContinueButton() {
  const { state, ready } = useProgress();
  const percent = ready ? courseCompletion(state.done) : 0;
  const next =
    weeks.find((week) => weekCompletion(state.done, week.slug) < 100) ?? weeks[0];

  return (
    <Button size="lg" render={<Link href={weekHref(next)} />}>
      {percent > 0 ? `Продолжить: неделя ${next.id}` : "Начать с недели 1"}
    </Button>
  );
}
