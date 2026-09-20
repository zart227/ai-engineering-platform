"use client";

import Link from "next/link";
import { useProgress, weekCompletion } from "@/components/progress-provider";
import { SavedTextarea } from "@/components/save-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { weeks, weekHref } from "@course";

export default function ProjectPage() {
  const { state, setProject, reset, ready } = useProgress();
  const filled = Boolean(state.project.name && state.project.problem);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm text-muted-foreground">Живой документ на все 6 недель</p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">Мой проект</h1>
      <p className="mt-3 text-base leading-7 text-foreground/80">
        Курс работает, если всё делается на одной задаче. Возьми рабочую боль,
        внутренний инструмент или маленький сервис. К шестой неделе у него
        должна быть ссылка и хоть какие-то цифры.
      </p>

      {!ready ? (
        <p className="mt-8 text-sm text-muted-foreground">Загружаю сохранённое…</p>
      ) : null}

      <Card className="mt-8 rounded-3xl">
        <CardHeader>
          <CardTitle>Карточка проекта</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Название">
            <Input
              value={state.project.name}
              onChange={(event) => setProject({ name: event.target.value })}
              placeholder="Например, Сводка записей для салона"
            />
          </Field>
          <Field label="Одной фразой">
            <Input
              value={state.project.oneLiner}
              onChange={(event) => setProject({ oneLiner: event.target.value })}
              placeholder="Кто и какую боль закрывает"
            />
          </Field>
          <Field label="Для кого">
            <Input
              value={state.project.audience}
              onChange={(event) => setProject({ audience: event.target.value })}
              placeholder="Не «все пользователи», а конкретная роль"
            />
          </Field>
        </CardContent>
      </Card>

      <label className="mt-4 flex flex-col gap-2 text-sm">
        <span className="font-medium">Проблема, как пойдёт в PRD</span>
        <textarea
          className="min-h-32 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={state.project.problem}
          onChange={(event) => setProject({ problem: event.target.value })}
          placeholder="Для [кто] в [ситуации] сейчас происходит [симптом], из-за этого [последствие]. Станет лучше, когда [планка]."
        />
      </label>

      {!filled ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-4 text-sm leading-6 text-muted-foreground">
          Пока нет названия и проблемы, недели будут абстрактными. Если совсем нет
          идеи, возьми то, что сам делаешь руками каждый день: отчёт, импорт,
          переписка, учёт. Этого хватит на v1.
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="font-heading text-2xl tracking-tight">Артефакты по неделям</h2>
        <div className="mt-4 space-y-4">
          {weeks.map((week) => (
            <Card key={week.slug} className="rounded-3xl">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Неделя {week.id}</p>
                  <CardTitle>{week.short}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{week.artifact}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={weekHref(week)} />}
                >
                  Открыть
                </Button>
              </CardHeader>
              <CardContent>
                <SavedTextarea
                  id={`${week.slug}-artifact`}
                  placeholder="Сюда же пишется артефакт недели. Поле общее с вкладкой «Артефакт»."
                  rows={5}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Готово на {weekCompletion(state.done, week.slug)}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          Всё хранится в этом браузере, на сервер ничего не уходит.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Сбросить прогресс и заметки в этом браузере?")) reset();
          }}
        >
          Сбросить прогресс
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
