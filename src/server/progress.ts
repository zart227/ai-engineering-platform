import { weeks } from "@course";
import { weekComplete, weekParts, weekPercent } from "@course/completion";
import { prisma } from "@/server/db";
import { logError } from "@/server/logger";

export async function recordEvent(
  userId: string,
  type: string,
  extra?: { weekSlug?: string; lessonId?: string; payload?: object }
) {
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

export async function loadLearningState(userId: string) {
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

  const latestQuiz = new Map<string, (typeof quizzes)[number]>();
  for (const attempt of quizzes) {
    if (!latestQuiz.has(attempt.weekSlug)) latestQuiz.set(attempt.weekSlug, attempt);
  }

  return {
    lessons,
    labs,
    exercises,
    artifacts,
    quizzes: latestQuiz,
    allQuizzes: quizzes,
    answers,
    notes,
    bookmarks,
    capstone,
    portfolio,
  };
}

export function summarizeWeeks(state: Awaited<ReturnType<typeof loadLearningState>>) {
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
  const state = await loadLearningState(userId);
  const row = summarizeWeeks(state).find((item) => item.week.slug === weekSlug);
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
