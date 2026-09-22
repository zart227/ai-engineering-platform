import Link from "next/link";
import { modules, weeks, weekHref, courseMeta } from "@course";
import { getSession } from "@/server/auth";
import { loadDueRecall, loadLearningFunnel } from "@/server/learning-lab";
import { coursePercent, currentWeek, loadLearningState, summarizeWeeks } from "@/server/progress";
import { LearningFunnel } from "@/components/learning-funnel";
import { RecallToday } from "@/components/recall-today";
import { Button } from "@/components/ui/button";
import { weekLabel } from "@/lib/week-label";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <p className="text-sm font-medium text-primary">Самостоятельная программа · {courseMeta.length}</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          {courseMeta.program}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/80 sm:text-lg">
          {courseMeta.tagline}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{courseMeta.about}</p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" render={<Link href="/register" />}>
            Зарегистрироваться
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Войти
          </Button>
        </div>
        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {modules.filter((item) => item.id !== "capstone").map((item) => (
            <div key={item.id} className="rounded-3xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Модуль {item.number}</p>
              <h2 className="mt-1 font-heading text-2xl">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    );
  }

  const [state, funnel, recall] = await Promise.all([
    loadLearningState(session.user.id),
    loadLearningFunnel(session.user.id),
    loadDueRecall(session.user.id),
  ]);
  const rows = summarizeWeeks(state);
  const percent = coursePercent(rows);
  const next = currentWeek(rows);
  const lessonsDone = rows.reduce((sum, item) => sum + item.parts.lessons.done, 0);
  const lessonsTotal = rows.reduce((sum, item) => sum + item.parts.lessons.total, 0);
  const labsDone = rows.filter((item) => item.parts.lab).length;
  const artifactsDone = rows.filter((item) => item.parts.artifact).length;
  const moduleRow = modules.find((item) => item.weekSlugs.includes(next.slug));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <p className="text-sm font-medium text-primary">Прогресс курса · {percent}%</p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">Продолжить обучение</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/80">
        Сейчас: {moduleRow?.title}. {weekLabel(next)}. {next.short}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="lg" render={<Link href={weekHref(next)} />}>
          Продолжить
        </Button>
        <Button variant="outline" render={<Link href="/project" />}>
          Журнал проекта
        </Button>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-4">
        {[
          ["Уроки", `${lessonsDone}/${lessonsTotal}`],
          ["Лабы", `${labsDone}/${weeks.length}`],
          ["Артефакты", `${artifactsDone}/${weeks.length}`],
          ["Проекты", String(state.portfolio.length + (state.capstone?.name ? 1 : 0))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <LearningFunnel snapshot={funnel} />
      <RecallToday
        items={recall.due}
        waiting={recall.waiting}
        startedCount={recall.startedCount}
        recallInStartedWeeks={recall.recallInStartedWeeks}
      />
      <section className="mt-12 space-y-8">
        {modules.map((mod) => (
          <div key={mod.id}>
            <h2 className="font-heading text-2xl">{mod.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {mod.weekSlugs.map((slug) => {
                const row = rows.find((item) => item.week.slug === slug);
                if (!row) return null;
                return (
                  <Link
                    key={slug}
                    href={weekHref(row.week)}
                    className="rounded-3xl border border-border bg-card p-5 hover:border-primary/30"
                  >
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{weekLabel(row.week)}</span>
                      <span>{row.percent}%</span>
                    </div>
                    <p className="mt-2 font-heading text-xl">{row.week.short}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{row.week.goal}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${row.percent}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
