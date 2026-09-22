import { weeks } from "@course";
import { weekComplete, weekParts, weekPercent } from "@course/completion";
import { cache } from "react";
import { prisma } from "@/server/db";
import { logError } from "@/server/logger";

export type ProgressSummaryInput = {
  lessons: { lessonId: string; completedAt: Date | null }[];
  labs: { labId: string; completedAt: Date | null }[];
  exercises: { exerciseId: string; completedAt: Date | null }[];
  artifacts: { weekSlug: string; completed: boolean }[];
  quizzes: Map<string, { passed: boolean }>;
};

function latestQuizByWeek<T extends { weekSlug: string }>(quizzes: T[]) {
  const latest = new Map<string, T>();
  for (const attempt of quizzes) {
    if (!latest.has(attempt.weekSlug)) latest.set(attempt.weekSlug, attempt);
  }
  return latest;
}

async function ensureWeekOpened(userId: string, weekSlug: string) {
  const existing = await prisma.learningEvent.findFirst({
    where: { userId, weekSlug, type: "week_opened" },
    select: { id: true },
  });
  if (existing) return;
  await prisma.learningEvent.create({
    data: { userId, type: "week_opened", weekSlug },
  });
}

export async function recordWeekOpened(userId: string, weekSlug: string) {
  try {
    await ensureWeekOpened(userId, weekSlug);
  } catch (error) {
    logError("week_opened_failed", { userId, weekSlug, error: String(error) });
  }
}

export async function recordEvent(
  userId: string,
  type: string,
  extra?: { weekSlug?: string; lessonId?: string; payload?: object }
) {
  if (extra?.weekSlug && type !== "week_opened") {
    await ensureWeekOpened(userId, extra.weekSlug);
  }
  await prisma.learningEvent.create({
    data: {
      userId,
      type,
      weekSlug: extra?.weekSlug,
      lessonId: extra?.lessonId,
      payload: extra?.payload as never,
    },
  });
}

async function loadCourseProgressData(userId: string): Promise<ProgressSummaryInput> {
  const [lessons, labs, exercises, artifacts, quizzes] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true },
    }),
    prisma.labProgress.findMany({
      where: { userId },
      select: { labId: true, completedAt: true },
    }),
    prisma.exerciseProgress.findMany({
      where: { userId },
      select: { exerciseId: true, completedAt: true },
    }),
    prisma.artifactProgress.findMany({
      where: { userId },
      select: { weekSlug: true, completed: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { weekSlug: true, passed: true },
    }),
  ]);

  return {
    lessons,
    labs,
    exercises,
    artifacts,
    quizzes: latestQuizByWeek(quizzes),
  };
}

/** Slim progress read for header percent — skips notes, bookmarks, answers, capstone, portfolio. */
export const loadCourseProgress = cache(loadCourseProgressData);

async function loadLearningStateData(userId: string) {
  const [
    lessons,
    labs,
    exercises,
    artifacts,
    quizzes,
    answers,
    notes,
    bookmarks,
    capstone,
    portfolio,
  ] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId } }),
    prisma.labProgress.findMany({ where: { userId } }),
    prisma.exerciseProgress.findMany({ where: { userId } }),
    prisma.artifactProgress.findMany({ where: { userId } }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.exerciseAnswer.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.bookmark.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.capstoneProject.findUnique({ where: { userId } }),
    prisma.portfolioProject.findMany({ where: { userId } }),
  ]);

  return {
    lessons,
    labs,
    exercises,
    artifacts,
    quizzes: latestQuizByWeek(quizzes),
    allQuizzes: quizzes,
    answers,
    notes,
    bookmarks,
    capstone,
    portfolio,
  };
}

/** Full learning state; deduped per request via React cache(). */
export const loadLearningState = cache(loadLearningStateData);

export function weekProgressForSlug(state: ProgressSummaryInput, weekSlug: string) {
  return summarizeWeeks(state).find((item) => item.week.slug === weekSlug);
}

export function summarizeWeeks(state: ProgressSummaryInput) {
  const completedLessons = new Set(
    state.lessons.filter((item) => item.completedAt).map((item) => item.lessonId)
  );
  const labDone = new Set(state.labs.filter((item) => item.completedAt).map((item) => item.labId));
  const practiceDone = new Set(
    state.exercises.filter((item) => item.completedAt).map((item) => item.exerciseId)
  );
  const artifactDone = new Set(
    state.artifacts.filter((item) => item.completed).map((item) => item.weekSlug)
  );

  return weeks.map((week) => {
    const quiz = state.quizzes.get(week.slug);
    const parts = weekParts(week, {
      completedLessons,
      labDone: labDone.has(week.lab.id),
      practiceDone: practiceDone.has(week.practice.id),
      artifactDone: artifactDone.has(week.slug),
      quizPassed: Boolean(quiz?.passed),
    });
    return {
      week,
      parts,
      percent: weekPercent(parts),
      complete: weekComplete(parts),
    };
  });
}

export async function persistWeekPercent(userId: string, weekSlug: string) {
  const state = await loadCourseProgressData(userId);
  const row = weekProgressForSlug(state, weekSlug);
  if (!row) return;
  await prisma.weekProgress.upsert({
    where: { userId_weekSlug: { userId, weekSlug } },
    update: {
      percent: row.percent,
      completedAt: row.complete ? new Date() : null,
    },
    create: {
      userId,
      weekSlug,
      percent: row.percent,
      completedAt: row.complete ? new Date() : null,
    },
  });
  if (!row.complete) return;
  const completed = await prisma.learningEvent.findFirst({
    where: { userId, weekSlug, type: "week_completed" },
    select: { id: true },
  });
  if (!completed) await recordEvent(userId, "week_completed", { weekSlug });
}

export function coursePercent(rows: ReturnType<typeof summarizeWeeks>) {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((sum, item) => sum + item.percent, 0) / rows.length);
}

export function currentWeek(rows: ReturnType<typeof summarizeWeeks>) {
  return rows.find((item) => !item.complete)?.week ?? rows[rows.length - 1]?.week ?? weeks[0];
}

export async function safePersistWeek(userId: string, weekSlug: string) {
  try {
    await persistWeekPercent(userId, weekSlug);
  } catch (error) {
    logError("week_percent_failed", { userId, weekSlug, error: String(error) });
  }
}
