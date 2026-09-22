"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRecallReviewedAction } from "@/app/actions/recall";
import { Button } from "@/components/ui/button";
import type { DueRecall } from "@/server/recall-schedule";

function itemKey(item: Pick<DueRecall, "weekSlug" | "itemIndex">) {
  return `${item.weekSlug}:${item.itemIndex}`;
}

export function RecallToday({
  items,
  waiting,
  startedCount,
  recallInStartedWeeks,
}: {
  items: DueRecall[];
  waiting: number;
  startedCount: number;
  recallInStartedWeeks: number;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState<string[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const visible = items.filter((item) => !hidden.includes(itemKey(item)));
  const emptyCopy =
    startedCount === 0
      ? "Начните неделю, и здесь появятся вопросы."
      : recallInStartedWeeks === 0
        ? "В открытых неделях пока нет карточек «Вспомни». Откройте следующую неделю — вопросы появятся здесь после первого прохождения."
        : "На сегодня вопросов нет. Следующие карточки появятся, когда наступит срок повторения.";

  return (
    <section className="mt-10" aria-labelledby="recall-today-title">
      <h2 id="recall-today-title" className="font-heading text-2xl">
        Сегодня повторить
      </h2>
      {visible.length === 0 && waiting === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyCopy}</p>
      ) : null}
      {visible.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {visible.map((item) => {
            const key = itemKey(item);
            const open = openKey === key;
            return (
              <li key={key} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{item.weekLabel}</p>
                <p className="mt-1 font-medium">{item.question}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="text-sm text-primary"
                    onClick={() => setOpenKey(open ? null : key)}
                  >
                    {open ? "Скрыть" : "Ответ"}
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingKey === key}
                    onClick={() => {
                      setError(null);
                      setPendingKey(key);
                      startTransition(async () => {
                        const result = await markRecallReviewedAction(item.weekSlug, item.itemIndex, true);
                        setPendingKey(null);
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setHidden((current) => [...current, key]);
                        router.refresh();
                      });
                    }}
                  >
                    Повторил
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pendingKey === key}
                    onClick={() => {
                      setError(null);
                      setPendingKey(key);
                      startTransition(async () => {
                        const result = await markRecallReviewedAction(item.weekSlug, item.itemIndex, false);
                        setPendingKey(null);
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setHidden((current) => [...current, key]);
                        router.refresh();
                      });
                    }}
                  >
                    Не помню
                  </Button>
                </div>
                {open ? <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {waiting > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Ещё {waiting}. Они останутся в списке.</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
