"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentBlocks, PromptCard } from "@/components/content-blocks";
import { DecisionCardView } from "@/components/decision-card";
import { SaveField } from "@/components/save-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { adjacentWeeks, weekHref, weeks } from "@course";
import type { Week } from "@course/types";
import {
  markHintAction,
  markSolutionAction,
  saveArtifactAction,
  saveNoteAction,
  savePracticeAnswerAction,
  submitQuizAction,
  toggleLabAction,
  toggleLessonAction,
  togglePracticeAction,
} from "@/app/actions/learn";

const tabs = [
  { id: "overview", label: "Обзор" },
  { id: "theory", label: "Теория" },
  { id: "lab", label: "Лаборатория" },
  { id: "practice", label: "Практика" },
  { id: "prompts", label: "Промпты" },
  { id: "artifact", label: "Артефакт" },
  { id: "quiz", label: "Квиз" },
  { id: "recall", label: "Вспомни" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export type WeekClientState = {
  completedLessons: string[];
  labDone: boolean;
  practiceDone: boolean;
  artifactDone: boolean;
  artifactNotes: string;
  githubUrl: string;
  demoUrl: string;
  practiceBody: string;
  practiceGithub: string;
  practiceResult: string;
  note: string;
  quizPassed: boolean;
  lastQuizScore: number | null;
  bookmarks: string[];
  percent: number;
};

export function WeekWorkspace({ week, initial }: { week: Week; initial: WeekClientState }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [state, setState] = useState(initial);
  const [, startTransition] = useTransition();
  const { prev, next } = adjacentWeeks(week.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Программа
          </p>
          <nav className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto pr-1">
            {weeks.map((item) => {
              const active = item.slug === week.slug;
              return (
                <Link
                  key={item.slug}
                  href={weekHref(item)}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="block text-xs opacity-80">Неделя {item.id}</span>
                  <span className="block font-medium">{item.short}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div>
          <p className="text-sm text-muted-foreground">
            Неделя {week.id} из {weeks.length}
            {week.status === "outlined" ? " · теория будет углубляться" : ""}
          </p>
          <h1 className="mt-2 max-w-3xl font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
            {week.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/80">{week.goal}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Артефакт</Badge>
            <p className="text-sm text-muted-foreground">{week.artifact.result}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {week.technologies.map((tool) => (
              <Badge key={tool} variant="outline">
                {tool}
              </Badge>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Прогресс недели</span>
              <span className="tabular-nums">{state.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${state.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              100% только если есть уроки, лаба, практика, квиз и артефакт.
            </p>
          </div>

          <div className="mt-8">
            <div role="tablist" className="flex flex-wrap gap-1 border-b border-border pb-px">
              {tabs.map((item) => {
                if (item.id === "recall" && week.recall.length === 0) return null;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "relative min-h-10 rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-foreground after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:bg-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {tab === "overview" ? <Overview week={week} /> : null}
            {tab === "theory" ? (
              <Theory
                week={week}
                completed={state.completedLessons}
                onToggle={(id, value) => {
                  startTransition(async () => {
                    await toggleLessonAction(id, week.slug, value);
                    setState((prev) => ({
                      ...prev,
                      completedLessons: value
                        ? [...prev.completedLessons, id]
                        : prev.completedLessons.filter((item) => item !== id),
                    }));
                    router.refresh();
                  });
                }}
              />
            ) : null}
            {tab === "lab" ? (
              <LabPanel
                week={week}
                done={state.labDone}
                note={state.note}
                onToggle={async (value) => {
                  await toggleLabAction(week.lab.id, week.slug, value);
                  setState((prev) => ({ ...prev, labDone: value }));
                  router.refresh();
                }}
                onNote={async (body) => saveNoteAction({ key: `${week.slug}-lab`, body, weekSlug: week.slug })}
              />
            ) : null}
            {tab === "practice" ? (
              <PracticePanel
                week={week}
                done={state.practiceDone}
                body={state.practiceBody}
                github={state.practiceGithub}
                result={state.practiceResult}
                onToggle={async (value) => {
                  await togglePracticeAction(week.practice.id, week.slug, value);
                  setState((prev) => ({ ...prev, practiceDone: value }));
                  router.refresh();
                }}
                onSave={async (next) => {
                  const result = await savePracticeAnswerAction({
                    exerciseId: week.practice.id,
                    weekSlug: week.slug,
                    body: next.body,
                    githubUrl: next.github,
                    resultUrl: next.result,
                  });
                  return result;
                }}
              />
            ) : null}
            {tab === "prompts" ? (
              <div className="mt-6 space-y-4" data-panel="prompts">
                <p className="font-heading text-2xl tracking-tight">Промпты</p>
                {week.prompts.map((prompt) => (
                  <div key={prompt.id} className="space-y-2">
                    <PromptCard title={prompt.title} when={prompt.when} text={prompt.text} />
                    <p className="text-sm leading-6 text-muted-foreground">{prompt.explanation}</p>
                    <p className="text-xs text-muted-foreground">Ограничения: {prompt.limitations}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {tab === "artifact" ? (
              <ArtifactPanel
                week={week}
                state={state}
                onSave={async (next) => {
                  const result = await saveArtifactAction({ weekSlug: week.slug, ...next });
                  if (result.ok) {
                    setState((prev) => ({ ...prev, ...next, artifactDone: next.completed }));
                    router.refresh();
                  }
                  return result;
                }}
              />
            ) : null}
            {tab === "quiz" ? (
              <QuizPanel
                week={week}
                passed={state.quizPassed}
                lastScore={state.lastQuizScore}
                onSubmit={async (answers) => {
                  const result = await submitQuizAction(week.slug, answers);
                  if (result.ok) {
                    setState((prev) => ({
                      ...prev,
                      quizPassed: result.passed,
                      lastQuizScore: result.score,
                    }));
                    router.refresh();
                  }
                  return result;
                }}
              />
            ) : null}
            {tab === "recall" ? (
              <div className="mt-6 space-y-4">
                <p className="font-heading text-2xl tracking-tight">Вспомни</p>
                {week.recall.map((item) => (
                  <Recall key={item.question} item={item} />
                ))}
              </div>
            ) : null}
          </div>

          {week.decisionCards.length > 0 && tab === "overview" ? (
            <div className="mt-8 space-y-4">
              {week.decisionCards.map((card) => (
                <DecisionCardView key={card.id} card={card} />
              ))}
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Button variant="outline" render={<Link href={weekHref(prev)} />}>
                Неделя {prev.id}. {prev.short}
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button render={<Link href={weekHref(next)} />}>Дальше: {next.short}</Button>
            ) : (
              <Button render={<Link href="/project" />}>К журналу проекта</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Overview({ week }: { week: Week }) {
  return (
    <div className="mt-6 space-y-6" data-panel="overview">
      <p className="font-heading text-2xl tracking-tight">Обзор</p>
      <p className="text-base leading-7">{week.overview.why}</p>
      <Meta title="Зачем" items={[week.overview.why]} />
      <Meta title="Prerequisites" items={week.overview.prerequisites} />
      <Meta title="Связь с прошлым" items={week.overview.previousKnowledge} />
      <Meta title="Production" items={week.overview.productionUse} />
      {week.overview.asOf ? (
        <p className="text-xs text-muted-foreground">Актуально на: {week.overview.asOf}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">Ориентир: {week.hours} часов.</p>
    </div>
  );
}

function Meta({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Theory({
  week,
  completed,
  onToggle,
}: {
  week: Week;
  completed: string[];
  onToggle: (id: string, value: boolean) => void;
}) {
  return (
    <div className="mt-6 space-y-8" data-panel="theory">
      <p className="font-heading text-2xl tracking-tight">Теория</p>
      {week.lessons.map((lesson) => (
        <article key={lesson.id} className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-heading text-2xl tracking-tight">{lesson.title}</h2>
            <Badge variant="outline">{lesson.minutes} мин</Badge>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {lesson.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-5">
            <ContentBlocks blocks={lesson.blocks} />
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <DoneButton
              checked={completed.includes(lesson.id)}
              onChange={(value) => onToggle(lesson.id, value)}
            >
              Отметить, что прочитал
            </DoneButton>
          </div>
        </article>
      ))}
    </div>
  );
}

function LabPanel({
  week,
  done,
  note,
  onToggle,
  onNote,
}: {
  week: Week;
  done: boolean;
  note: string;
  onToggle: (value: boolean) => Promise<void>;
  onNote: (body: string) => Promise<{ ok: boolean }>;
}) {
  const lab = week.lab;
  return (
    <div className="mt-6 space-y-5" data-panel="lab">
      <p className="font-heading text-2xl tracking-tight">{lab.title}</p>
      <p className="text-base leading-7">{lab.goal}</p>
      <Meta title="Setup" items={lab.setup} />
      <ol className="space-y-4">
        {lab.steps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-border p-4">
            <p className="font-medium">
              {index + 1}. {step.title}
            </p>
            <p className="mt-2 text-sm leading-6">{step.body}</p>
            {step.expected ? (
              <p className="mt-2 text-sm text-muted-foreground">Ожидание: {step.expected}</p>
            ) : null}
          </li>
        ))}
      </ol>
      {lab.troubleshooting.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Troubleshooting</p>
          <ul className="mt-2 space-y-2 text-sm leading-6">
            {lab.troubleshooting.map((item) => (
              <li key={item.problem}>
                <span className="font-medium">{item.problem}. </span>
                {item.fix}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Meta title="Reflection" items={lab.reflection} />
      <SaveField
        value={note}
        placeholder="Заметки лаборатории"
        cacheKey={`${week.slug}-lab`}
        onSave={onNote}
      />
      <DoneButton checked={done} onChange={(value) => onToggle(value)}>
        Лаборатория сделана
      </DoneButton>
    </div>
  );
}

function PracticePanel({
  week,
  done,
  body,
  github,
  result,
  onToggle,
  onSave,
}: {
  week: Week;
  done: boolean;
  body: string;
  github: string;
  result: string;
  onToggle: (value: boolean) => Promise<void>;
  onSave: (next: { body: string; github: string; result: string }) => Promise<{ ok: boolean }>;
}) {
  const exercise = week.practice;
  const [githubUrl, setGithub] = useState(github);
  const [resultUrl, setResult] = useState(result);
  const [openHint, setOpenHint] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="mt-6 space-y-5" data-panel="practice">
      <p className="font-heading text-2xl tracking-tight">{exercise.title}</p>
      <p className="text-sm text-muted-foreground">{exercise.time}</p>
      <p className="text-base leading-7">{exercise.context}</p>
      <Meta title="Requirements" items={exercise.requirements} />
      <Meta title="Constraints" items={exercise.constraints} />
      <Meta title="Acceptance" items={exercise.acceptance} />
      <Meta title="Tests" items={exercise.tests} />
      <SaveField
        value={body}
        placeholder="Черновик, выводы, ссылки"
        cacheKey={exercise.id}
        onSave={(next) => onSave({ body: next, github: githubUrl, result: resultUrl })}
      />
      <label className="block text-sm">
        GitHub URL
        <input
          className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
          value={githubUrl}
          onChange={(event) => setGithub(event.target.value)}
          onBlur={() => onSave({ body, github: githubUrl, result: resultUrl })}
        />
      </label>
      <label className="block text-sm">
        Result / demo URL
        <input
          className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
          value={resultUrl}
          onChange={(event) => setResult(event.target.value)}
          onBlur={() => onSave({ body, github: githubUrl, result: resultUrl })}
        />
      </label>
      <div className="space-y-2">
        {exercise.hints.slice(0, openHint).map((hint) => (
          <p key={hint.title} className="rounded-xl bg-muted px-3 py-2 text-sm leading-6">
            <span className="font-medium">{hint.title}. </span>
            {hint.text}
          </p>
        ))}
        {openHint < exercise.hints.length ? (
          <Button
            variant="outline"
            onClick={() => {
              setOpenHint((value) => value + 1);
              void markHintAction(exercise.id, week.slug);
            }}
          >
            Hint {openHint + 1}
          </Button>
        ) : null}
      </div>
      <div>
        <Button
          variant="ghost"
          onClick={() => {
            setShowSolution(true);
            void markSolutionAction(exercise.id, week.slug);
          }}
        >
          Показать решение
        </Button>
        {showSolution ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{exercise.solution}</p>
        ) : null}
      </div>
      <DoneButton checked={done} onChange={(value) => onToggle(value)}>
        Практика сделана
      </DoneButton>
    </div>
  );
}

function ArtifactPanel({
  week,
  state,
  onSave,
}: {
  week: Week;
  state: WeekClientState;
  onSave: (next: {
    notes: string;
    githubUrl: string;
    demoUrl: string;
    completed: boolean;
  }) => Promise<{ ok: boolean }>;
}) {
  const [githubUrl, setGithub] = useState(state.githubUrl);
  const [demoUrl, setDemo] = useState(state.demoUrl);
  const [notes, setNotes] = useState(state.artifactNotes);

  return (
    <div className="mt-6 space-y-5" data-panel="artifact">
      <p className="font-heading text-2xl tracking-tight">Артефакт</p>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Что должно остаться</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{week.artifact.result}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Meta title="README" items={week.artifact.readme} />
          <Meta title="Архитектура" items={week.artifact.architecture} />
          <Meta title="Тесты" items={week.artifact.tests} />
          <ul className="text-sm leading-6">
            {week.artifact.checklist.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
          <SaveField
            value={notes}
            placeholder="Ссылки, формулировки, чеклист текстом"
            cacheKey={`${week.slug}-artifact`}
            onSave={async (next) => {
              setNotes(next);
              return onSave({ notes: next, githubUrl, demoUrl, completed: state.artifactDone });
            }}
          />
          <label className="block text-sm">
            GitHub
            <input
              className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
              value={githubUrl}
              onChange={(event) => setGithub(event.target.value)}
              onBlur={() => onSave({ notes, githubUrl, demoUrl, completed: state.artifactDone })}
            />
          </label>
          <label className="block text-sm">
            Demo
            <input
              className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
              value={demoUrl}
              onChange={(event) => setDemo(event.target.value)}
              onBlur={() => onSave({ notes, githubUrl, demoUrl, completed: state.artifactDone })}
            />
          </label>
          <DoneButton
            checked={state.artifactDone}
            onChange={(value) => onSave({ notes, githubUrl, demoUrl, completed: value })}
          >
            Артефакт готов. Без этого неделя не 100%.
          </DoneButton>
        </CardContent>
      </Card>
    </div>
  );
}

function QuizPanel({
  week,
  passed,
  lastScore,
  onSubmit,
}: {
  week: Week;
  passed: boolean;
  lastScore: number | null;
  onSubmit: (answers: number[]) => Promise<{ ok: boolean; score?: number; passed?: boolean }>;
}) {
  const [answers, setAnswers] = useState<number[]>(week.quiz.questions.map(() => -1));
  const [message, setMessage] = useState("");

  return (
    <div className="mt-6 space-y-5" data-panel="quiz">
      <p className="font-heading text-2xl tracking-tight">Квиз</p>
      <p className="text-sm text-muted-foreground">
        Проходной балл {week.quiz.passScore}%. Последний результат:{" "}
        {lastScore == null ? "ещё не сдавали" : `${lastScore}%`}
        {passed ? " · зачёт" : ""}
      </p>
      {week.quiz.questions.map((question, index) => (
        <fieldset key={question.id} className="rounded-2xl border border-border p-4">
          <legend className="font-medium">
            {index + 1}. {question.prompt}
          </legend>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{question.kind}</p>
          <div className="mt-3 space-y-2">
            {question.options.map((option, optionIndex) => (
              <label key={option} className="flex gap-2 text-sm leading-6">
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[index] === optionIndex}
                  onChange={() =>
                    setAnswers((current) => {
                      const next = [...current];
                      next[index] = optionIndex;
                      return next;
                    })
                  }
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        onClick={async () => {
          const result = await onSubmit(answers);
          if (!result.ok) setMessage("Не удалось отправить");
          else setMessage(`Счёт ${result.score}%. ${result.passed ? "Зачёт." : "Попробуйте ещё."}`);
        }}
      >
        Отправить
      </Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}

function Recall({ item }: { item: { question: string; answer: string; fromWeek: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{item.fromWeek}</p>
      <p className="mt-1 font-medium">{item.question}</p>
      <button type="button" className="mt-2 text-sm text-primary" onClick={() => setOpen((v) => !v)}>
        {open ? "Скрыть" : "Ответ"}
      </button>
      {open ? <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p> : null}
    </div>
  );
}

function DoneButton({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void | Promise<unknown>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-left"
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
        )}
      >
        {checked ? "✓" : null}
      </span>
      <span className={cn("text-sm leading-6", checked && "text-muted-foreground")}>{children}</span>
    </button>
  );
}
