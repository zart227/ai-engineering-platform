"use client";

import Link from "next/link";
import { ContentBlocks, PromptCard } from "@/components/content-blocks";
import { DoneRow, SavedTextarea } from "@/components/save-fields";
import { weekCompletion, useProgress } from "@/components/progress-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { weeks, weekHref } from "@/lib/course";
import type { Week } from "@/lib/course/types";

export function WeekView({ week }: { week: Week }) {
  const { state } = useProgress();
  const percent = weekCompletion(state.done, week.slug);
  const index = weeks.findIndex((item) => item.slug === week.slug);
  const prev = index > 0 ? weeks[index - 1] : null;
  const next = index < weeks.length - 1 ? weeks[index + 1] : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Программа
          </p>
          <nav className="mt-3 space-y-1">
            {weeks.map((item) => {
              const active = item.slug === week.slug;
              const done = weekCompletion(state.done, item.slug);
              return (
                <Link
                  key={item.slug}
                  href={weekHref(item)}
                  className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="block text-xs opacity-80">Неделя {item.id}</span>
                  <span className="block font-medium">{item.short}</span>
                  {!active ? (
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-foreground/10">
                      <span
                        className="block h-full bg-primary"
                        style={{ width: `${done}%` }}
                      />
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div>
          <p className="text-sm text-muted-foreground">Неделя {week.id} из 6</p>
          <h1 className="mt-2 max-w-3xl font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
            {week.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/80">
            {week.goal}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Артефакт</Badge>
            <p className="text-sm text-muted-foreground">{week.artifact}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {week.tools.map((tool) => (
              <Badge key={tool} variant="outline">
                {tool}
              </Badge>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Прогресс недели</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <Tabs defaultValue="theory" className="mt-8">
            <TabsList variant="line" className="h-auto w-full max-w-full flex-wrap justify-start gap-0 rounded-none border-b">
              <TabsTrigger value="theory" className="px-3">
                Теория
              </TabsTrigger>
              <TabsTrigger value="practice" className="px-3">
                Практика
              </TabsTrigger>
              <TabsTrigger value="prompts" className="px-3">
                Промпты
              </TabsTrigger>
              <TabsTrigger value="artifact" className="px-3">
                Артефакт
              </TabsTrigger>
            </TabsList>

            <TabsContent value="theory" className="mt-6 space-y-8">
              {week.theory.map((lesson) => (
                <article
                  key={lesson.id}
                  className="rounded-3xl border border-border bg-card p-5 sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="font-heading text-2xl tracking-tight">
                      {lesson.title}
                    </h2>
                    <Badge variant="outline">{lesson.minutes} мин</Badge>
                  </div>
                  <div className="mt-5">
                    <ContentBlocks blocks={lesson.blocks} />
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <DoneRow id={lesson.id}>Отметить, что прочитал</DoneRow>
                  </div>
                </article>
              ))}
            </TabsContent>

            <TabsContent value="practice" className="mt-6 space-y-6">
              {week.practice.map((exercise, index) => (
                <Card key={exercise.id} className="rounded-3xl py-5">
                  <CardHeader>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Задание {index + 1} · {exercise.time}
                    </p>
                    <CardTitle className="font-heading text-2xl">
                      {exercise.title}
                    </CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {exercise.goal}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium">Как делать</p>
                      <ol className="space-y-2">
                        {exercise.steps.map((step, stepIndex) => (
                          <li key={step} className="flex gap-3 text-sm leading-6">
                            <span className="w-5 shrink-0 font-heading text-primary">
                              {stepIndex + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6">
                      <span className="font-medium">На выходе. </span>
                      {exercise.output}
                    </div>
                    <SavedTextarea
                      id={exercise.id}
                      placeholder="Пиши сюда черновик, выводы, ссылки. Сохраняется в браузере."
                    />
                    <DoneRow id={exercise.id}>Задание сделано</DoneRow>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="prompts" className="mt-6 space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Копируй, подставляй свой контекст, не отправляй пустые скобки. Если
                модель начинает выдумывать факты, останови и докинь источники.
              </p>
              {week.prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  title={prompt.title}
                  when={prompt.when}
                  text={prompt.text}
                />
              ))}
            </TabsContent>

            <TabsContent value="artifact" className="mt-6 space-y-5">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Что должно остаться после недели</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {week.artifact}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    {week.checklist.map((item) => (
                      <DoneRow key={item.id} id={item.id}>
                        {item.text}
                      </DoneRow>
                    ))}
                  </div>
                  <SavedTextarea
                    id={`${week.slug}-artifact`}
                    placeholder="Сложи сюда сам артефакт: ссылки, формулировки, таблицу фактов, решение go/kill."
                    rows={12}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Button variant="outline" render={<Link href={weekHref(prev)} />}>
                Неделя {prev.id}. {prev.short}
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button render={<Link href={weekHref(next)} />}>
                Дальше: {next.short}
              </Button>
            ) : (
              <Button render={<Link href="/project" />}>Собрать кейс проекта</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
