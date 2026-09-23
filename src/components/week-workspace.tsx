"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookmarkButton } from "@/components/bookmark-button";
import { LessonTutor } from "@/components/lesson-tutor";
import { ContentBlocks, PromptCard } from "@/components/content-blocks";
import { DecisionCardView } from "@/components/decision-card";
import { SaveField } from "@/components/save-field";
import { WeekNav } from "@/components/week-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { weekLabel, weekPosition } from "@/lib/week-label";
import { adjacentWeeks, weekHref, weekModule } from "@course";
import type { WeekClientPayload } from "@/server/week-client-payload";
import { markRecallReviewedAction } from "@/app/actions/recall";
import {
  markHintAction,
  markSolutionAction,
  revealRecallAnswerAction,
  saveArtifactAction,
  saveArtifactAssessmentAction,
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

export type ArtifactAssessmentClientState = {
  score: number;
  passed: boolean;
  source: "self_check" | "policy_approved";
  criteria: Array<{
    criterionId: string;
    name: string;
    weight: number;
    expectedEvidence: string;
    met: boolean;
    evidence: string;
  }>;
};

export type WeekClientState = {
  completedLessons: string[];
  labDone: boolean;
  practiceDone: boolean;
  artifactDone: boolean;
  artifactNotes: string;
  githubUrl: string;
  demoUrl: string;
  artifactAssessment: ArtifactAssessmentClientState | null;
  practiceBody: string;
  practiceGithub: string;
  practiceResult: string;
  hintsUsed: number;
  note: string;
  quizPassed: boolean;
  lastQuizScore: number | null;
  bookmarks: string[];
  percent: number;
};

export function WeekWorkspace({ week, initial }: { week: WeekClientPayload; initial: WeekClientState }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [state, setState] = useState(initial);
  const [, startTransition] = useTransition();
  const { prev, next } = adjacentWeeks(week.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <WeekBreadcrumb week={week} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <WeekNav week={week} />
        <div>
          <p className="text-sm text-muted-foreground">
            {weekPosition(week)}
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
              <span>Прогресс</span>
              <span className="tabular-nums">{state.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${state.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              100% только если есть уроки, лаба, практика, квиз, артефакт и зачёт по рубрике.
            </p>
          </div>

          <div className="mt-8">
            <div role="tablist" aria-label="Разделы недели" className="flex flex-wrap gap-1 border-b border-border pb-px">
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
                bookmarks={state.bookmarks}
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
                hintsUsed={state.hintsUsed}
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
                    <div className="flex justify-end">
                      <BookmarkButton
                        targetType="prompt"
                        targetId={prompt.id}
                        title={prompt.title}
                        href={`/week/${week.slug}`}
                        initial={state.bookmarks.includes(prompt.id)}
                      />
                    </div>
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
                onSaveAssessment={async (criteria) => {
                  const result = await saveArtifactAssessmentAction({
                    weekSlug: week.slug,
                    criteria,
                  });
                  if (result.ok) {
                    setState((prev) => {
                      const current = prev.artifactAssessment;
                      if (!current) {
                        return {
                          ...prev,
                          artifactDone: result.passed ? prev.artifactDone : false,
                        };
                      }
                      return {
                        ...prev,
                        artifactDone: result.passed ? prev.artifactDone : false,
                        artifactAssessment: {
                          ...current,
                          score: result.score,
                          passed: result.passed,
                          source: "self_check",
                          criteria: current.criteria.map((item) => {
                            const next = criteria.find((row) => row.criterionId === item.criterionId);
                            return next
                              ? { ...item, met: next.met, evidence: next.evidence }
                              : item;
                          }),
                        },
                      };
                    });
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
                {week.recall.map((item, index) => (
                  <Recall key={item.question} item={item} weekSlug={week.slug} recallIndex={index} />
                ))}
              </div>
            ) : null}
          </div>

          {week.decisionCards.length > 0 && tab === "overview" ? (
            <div className="mt-8 space-y-4">
              {week.decisionCards.map((card) => (
                <div key={card.id} className="space-y-2">
                  <DecisionCardView card={card} />
                  <BookmarkButton
                    targetType="decision"
                    targetId={card.id}
                    title={card.title}
                    href={`/week/${week.slug}`}
                    initial={state.bookmarks.includes(card.id)}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Button variant="outline" render={<Link href={weekHref(prev)} />}>
                {weekLabel(prev)}. {prev.short}
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

function WeekBreadcrumb({ week }: { week: WeekClientPayload }) {
  const courseModule = weekModule(week);
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="transition-colors hover:text-foreground">
            Курс
          </Link>
        </li>
        <li aria-hidden="true">→</li>
        <li>{courseModule.title}</li>
        <li aria-hidden="true">→</li>
        <li aria-current="page" className="text-foreground">
          {weekLabel(week)}
        </li>
      </ol>
    </nav>
  );
}

function Overview({ week }: { week: WeekClientPayload }) {
  return (
    <div className="mt-6 space-y-6" data-panel="overview">
      <p className="font-heading text-2xl tracking-tight">Обзор</p>
      <p className="text-base leading-7">{week.overview.why}</p>
      {week.learningObjectives && week.learningObjectives.length > 0 ? (
        <Meta title="Цели обучения" items={week.learningObjectives} />
      ) : null}
      {week.artifactRubric && week.artifactRubric.criteria.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Рубрика артефакта</p>
          <ul className="mt-2 space-y-3 text-sm leading-6 text-muted-foreground">
            {week.artifactRubric.criteria.map((criterion) => (
              <li key={criterion.id}>
                <span className="font-medium text-foreground">{criterion.name}</span>
                <span> · {criterion.weight}%</span>
                <p className="mt-1">{criterion.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Meta title="Зачем" items={[week.overview.why]} />
      <Meta title="Что уже нужно" items={week.overview.prerequisites} />
      <Meta title="Связь с прошлым" items={week.overview.previousKnowledge} />
      <Meta title="В продакшене" items={week.overview.productionUse} />
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
  bookmarks,
  onToggle,
}: {
  week: WeekClientPayload;
  completed: string[];
  bookmarks: string[];
  onToggle: (id: string, value: boolean) => void;
}) {
  return (
    <div className="mt-6 space-y-8" data-panel="theory">
      <p className="font-heading text-2xl tracking-tight">Теория</p>
      {week.lessons.map((lesson) => (
        <article key={lesson.id} className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-heading text-2xl tracking-tight">{lesson.title}</h2>
            <div className="flex items-center gap-2">
              <BookmarkButton
                targetType="lesson"
                targetId={lesson.id}
                title={lesson.title}
                href={`/week/${week.slug}`}
                initial={bookmarks.includes(lesson.id)}
              />
              <Badge variant="outline">{lesson.minutes} мин</Badge>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {lesson.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-5">
            <ContentBlocks blocks={lesson.blocks} weekSlug={week.slug} lessonId={lesson.id} />
          </div>
          <LessonTutor weekSlug={week.slug} lessonId={lesson.id} />
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
  week: WeekClientPayload;
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
      <Meta title="Подготовка" items={lab.setup} />
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
          <p className="text-sm font-medium">Если сломалось</p>
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
      <Meta title="Рефлексия" items={lab.reflection} />
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
  hintsUsed,
  onToggle,
  onSave,
}: {
  week: WeekClientPayload;
  done: boolean;
  body: string;
  github: string;
  result: string;
  hintsUsed: number;
  onToggle: (value: boolean) => Promise<void>;
  onSave: (next: { body: string; github: string; result: string }) => Promise<{ ok: boolean }>;
}) {
  const exercise = week.practice;
  const [githubUrl, setGithub] = useState(github);
  const [resultUrl, setResult] = useState(result);
  const [openHint, setOpenHint] = useState(hintsUsed);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);

  return (
    <div className="mt-6 space-y-5" data-panel="practice">
      <p className="font-heading text-2xl tracking-tight">{exercise.title}</p>
      <p className="text-sm text-muted-foreground">{exercise.time}</p>
      <p className="text-base leading-7">{exercise.context}</p>
      <Meta title="Требования" items={exercise.requirements} />
      <Meta title="Ограничения" items={exercise.constraints} />
      <Meta title="Приёмка" items={exercise.acceptance} />
      <Meta title="Проверки" items={exercise.tests} />
      <SaveField
        value={body}
        placeholder="Черновик, выводы, ссылки"
        cacheKey={exercise.id}
        onSave={(next) => onSave({ body: next, github: githubUrl, result: resultUrl })}
      />
      <label className="block text-sm">
        Ссылка на GitHub
        <input
          className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
          value={githubUrl}
          onChange={(event) => setGithub(event.target.value)}
          onBlur={() => onSave({ body, github: githubUrl, result: resultUrl })}
        />
      </label>
      <label className="block text-sm">
        Ссылка на результат
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
            Подсказка {openHint + 1}
          </Button>
        ) : null}
      </div>
      <div>
        <Button
          variant="ghost"
          onClick={async () => {
            const result = await markSolutionAction(exercise.id, week.slug);
            if (!result.ok) return;
            setSolution(result.solution);
            setShowSolution(true);
          }}
        >
          Показать решение
        </Button>
        {showSolution && solution ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{solution}</p>
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
  onSaveAssessment,
}: {
  week: WeekClientPayload;
  state: WeekClientState;
  onSave: (next: {
    notes: string;
    githubUrl: string;
    demoUrl: string;
    completed: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  onSaveAssessment: (
    criteria: Array<{ criterionId: string; met: boolean; evidence: string }>
  ) => Promise<{ ok: boolean; score?: number; passed?: boolean; error?: string }>;
}) {
  const [githubUrl, setGithub] = useState(state.githubUrl);
  const [demoUrl, setDemo] = useState(state.demoUrl);
  const [notes, setNotes] = useState(state.artifactNotes);
  const [criteria, setCriteria] = useState(
    () => state.artifactAssessment?.criteria.map((item) => ({ ...item })) ?? []
  );
  const [assessmentMessage, setAssessmentMessage] = useState("");
  const [artifactError, setArtifactError] = useState("");
  const rubricPassed = Boolean(state.artifactAssessment?.passed);
  const score = state.artifactAssessment?.score ?? 0;
  const isPolicyApproved = state.artifactAssessment?.source === "policy_approved";

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

          {criteria.length > 0 ? (
            <div className="space-y-4 border-t border-border pt-4" data-panel="artifact-rubric">
              <div>
                <p className="text-sm font-medium">Самооценка по рубрике</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Отметьте критерии и опишите доказательство. ИИ-проверка в V1 не используется.
                </p>
              </div>
              {criteria.map((item, index) => (
                <div key={item.criterionId} className="space-y-2 rounded-xl border border-border p-3">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={item.met}
                      aria-label={`Критерий выполнен: ${item.name}`}
                      onChange={(event) => {
                        const met = event.target.checked;
                        setCriteria((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, met } : row
                          )
                        );
                      }}
                    />
                    <span>
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="text-muted-foreground"> · {item.weight}%</span>
                      <span className="mt-1 block text-muted-foreground">{item.expectedEvidence}</span>
                    </span>
                  </label>
                  <label className="block text-sm">
                    Доказательство
                    <textarea
                      className="mt-1 min-h-20 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
                      value={item.evidence}
                      aria-label={`Доказательство: ${item.name}`}
                      placeholder="Что именно видно в репозитории, README или логе"
                      onChange={(event) => {
                        const evidence = event.target.value;
                        setCriteria((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, evidence } : row
                          )
                        );
                      }}
                    />
                  </label>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={async () => {
                    setAssessmentMessage("");
                    const result = await onSaveAssessment(
                      criteria.map((item) => ({
                        criterionId: item.criterionId,
                        met: item.met,
                        evidence: item.evidence,
                      }))
                    );
                    if (!result.ok) {
                      setAssessmentMessage(result.error ?? "Не удалось сохранить самооценку.");
                      return;
                    }
                    setAssessmentMessage(
                      result.passed
                        ? `Рубрика пройдена · ${result.score}%`
                        : `Рубрика не пройдена · ${result.score}%`
                    );
                  }}
                >
                  Сохранить самооценку
                </Button>
                <p className="text-sm text-muted-foreground" data-testid="artifact-rubric-result">
                  {isPolicyApproved
                    ? "Зачёт по политике (legacy)."
                    : rubricPassed
                      ? `Зачёт · ${score}%`
                      : `Пока ${score}% · нужен зачёт по всем критериям`}
                </p>
              </div>
              {assessmentMessage ? (
                <p className="text-sm text-muted-foreground">{assessmentMessage}</p>
              ) : null}
            </div>
          ) : null}

          <DoneButton
            checked={state.artifactDone}
            onChange={async (value) => {
              setArtifactError("");
              const result = await onSave({
                notes,
                githubUrl,
                demoUrl,
                completed: value,
              });
              if (!result.ok) {
                setArtifactError(result.error ?? "Не удалось сохранить артефакт.");
              }
            }}
          >
            Артефакт готов. Нужны репозиторий и зачёт по рубрике.
          </DoneButton>
          {artifactError ? <p className="text-sm text-destructive">{artifactError}</p> : null}
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
  week: WeekClientPayload;
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

function Recall({
  item,
  weekSlug,
  recallIndex,
}: {
  item: { question: string; fromWeek: string };
  weekSlug: string;
  recallIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<"recalled" | "missed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  async function recordReview(recalled: boolean) {
    setError(null);
    setPending(true);
    startTransition(async () => {
      const result = await markRecallReviewedAction(weekSlug, recallIndex, recalled);
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRecorded(recalled ? "recalled" : "missed");
    });
  }

  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{item.fromWeek}</p>
      <p className="mt-1 font-medium">{item.question}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="text-sm text-primary"
          onClick={async () => {
            if (!open && answer === null) {
              const result = await revealRecallAnswerAction(weekSlug, recallIndex);
              if (result.ok) setAnswer(result.answer);
            }
            setOpen((value) => !value);
          }}
        >
          {open ? "Скрыть" : "Ответ"}
        </button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || recorded !== null}
          onClick={() => recordReview(true)}
        >
          Повторил
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending || recorded !== null}
          onClick={() => recordReview(false)}
        >
          Не помню
        </Button>
      </div>
      {open && answer ? <p className="mt-2 text-sm text-muted-foreground">{answer}</p> : null}
      {recorded === "recalled" ? (
        <p className="mt-2 text-sm text-muted-foreground">Повторение записано.</p>
      ) : null}
      {recorded === "missed" ? (
        <p className="mt-2 text-sm text-muted-foreground">Записали пропуск — карточка вернётся завтра.</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
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
