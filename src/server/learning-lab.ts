import { getWeek, weeks } from "@course";
import { prisma } from "@/server/db";
import { countFunnel, FUNNEL_EVENT_TYPES } from "@/server/funnel";
import { DUE_RECALL_LIMIT, nextReviewAt, selectDueRecall, startedWeekSlugs } from "@/server/recall-schedule";

export async function loadLearningFunnel(userId: string) {
  const rows = await prisma.learningEvent.groupBy({
    by: ["weekSlug", "type"],
    where: {
      userId,
      type: { in: FUNNEL_EVENT_TYPES },
      weekSlug: { not: null },
    },
  });
  const events = rows.map((row) => ({
    userId,
    type: row.type,
    weekSlug: row.weekSlug,
  }));
  return countFunnel(events, userId);
}

export async function loadStartedWeekSlugs(userId: string) {
  const [weekProgress, lessons, labs, exercises, artifacts, quizzes, openedWeeks] = await Promise.all([
    prisma.weekProgress.findMany({ where: { userId }, select: { weekSlug: true } }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { weekSlug: true } }),
    prisma.labProgress.findMany({ where: { userId }, select: { weekSlug: true } }),
    prisma.exerciseProgress.findMany({ where: { userId }, select: { weekSlug: true } }),
    prisma.artifactProgress.findMany({ where: { userId }, select: { weekSlug: true } }),
    prisma.quizAttempt.findMany({ where: { userId }, select: { weekSlug: true } }),
    prisma.learningEvent.findMany({
      where: { userId, type: "week_opened", weekSlug: { not: null } },
      select: { weekSlug: true },
    }),
  ]);
  const opened = openedWeeks.flatMap((row) => (row.weekSlug ? [{ weekSlug: row.weekSlug }] : []));
  return startedWeekSlugs([weekProgress, lessons, labs, exercises, artifacts, quizzes, opened]);
}

export async function loadDueRecall(userId: string, now = new Date()) {
  const [startedSlugs, reviews] = await Promise.all([
    loadStartedWeekSlugs(userId),
    prisma.recallReview.findMany({
      where: { userId },
      select: {
        weekSlug: true,
        itemIndex: true,
        prompt: true,
        nextReviewAt: true,
        reviewCount: true,
      },
    }),
  ]);
  return selectDueRecall({
    weeks: weeks.map((week) => ({ slug: week.slug, id: week.id, recall: week.recall })),
    startedSlugs,
    reviews,
    now,
    limit: DUE_RECALL_LIMIT,
  });
}

export async function userStartedWeek(userId: string, weekSlug: string) {
  const started = await loadStartedWeekSlugs(userId);
  return started.has(weekSlug);
}

export async function saveRecallReview(userId: string, weekSlug: string, itemIndex: number, now = new Date()) {
  const week = getWeek(weekSlug);
  const item = week?.recall[itemIndex];
  if (!week || itemIndex < 0 || !Number.isInteger(itemIndex) || !item) {
    return { ok: false as const, error: "Вопрос не найден." };
  }
  if (!(await userStartedWeek(userId, weekSlug))) {
    return { ok: false as const, error: "Эта неделя ещё не начата." };
  }

  const existing = await prisma.recallReview.findUnique({
    where: { userId_weekSlug_itemIndex: { userId, weekSlug, itemIndex } },
  });
  const samePrompt = existing?.prompt === item.question;
  const reviewCount = samePrompt ? existing.reviewCount + 1 : 1;
  const dueAt = nextReviewAt(reviewCount, now);
  await prisma.recallReview.upsert({
    where: { userId_weekSlug_itemIndex: { userId, weekSlug, itemIndex } },
    update: { prompt: item.question, reviewCount, nextReviewAt: dueAt },
    create: {
      userId,
      weekSlug,
      itemIndex,
      prompt: item.question,
      reviewCount,
      nextReviewAt: dueAt,
    },
  });
  return { ok: true as const };
}
