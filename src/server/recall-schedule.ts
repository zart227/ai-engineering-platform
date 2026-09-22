import { weekLabel } from "@/lib/week-label";

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVAL_DAYS = [1, 3, 7, 21] as const;

export const DUE_RECALL_LIMIT = 8;

export type WeekRecallSource = {
  slug: string;
  id: number;
  recall: { question: string; answer: string }[];
};

export type StoredRecallReview = {
  weekSlug: string;
  itemIndex: number;
  prompt: string;
  nextReviewAt: Date;
  reviewCount: number;
};

export type DueRecall = {
  weekSlug: string;
  weekId: number;
  weekLabel: string;
  itemIndex: number;
  question: string;
  answer: string;
  reviewCount: number;
};

export type DueRecallList = {
  due: DueRecall[];
  waiting: number;
  startedCount: number;
  recallInStartedWeeks: number;
};

export function intervalDays(reviewCount: number) {
  const index = Math.min(Math.max(reviewCount, 1), INTERVAL_DAYS.length) - 1;
  return INTERVAL_DAYS[index];
}

export function nextReviewAt(reviewCount: number, now: Date) {
  return new Date(now.getTime() + intervalDays(reviewCount) * DAY_MS);
}

export function startedWeekSlugs(groups: Iterable<{ weekSlug: string }>[]) {
  const slugs = new Set<string>();
  for (const group of groups) {
    for (const row of group) {
      if (row.weekSlug) slugs.add(row.weekSlug);
    }
  }
  return slugs;
}

function reviewKey(weekSlug: string, itemIndex: number) {
  return `${weekSlug}:${itemIndex}`;
}

export function selectDueRecall(input: {
  weeks: WeekRecallSource[];
  startedSlugs: ReadonlySet<string>;
  reviews: StoredRecallReview[];
  now: Date;
  limit?: number;
}): DueRecallList {
  const reviews = new Map(
    input.reviews.map((review) => [reviewKey(review.weekSlug, review.itemIndex), review])
  );
  const due: DueRecall[] = [];
  let recallInStartedWeeks = 0;
  const weeks = [...input.weeks].sort((left, right) => left.id - right.id || left.slug.localeCompare(right.slug));

  for (const week of weeks) {
    if (!input.startedSlugs.has(week.slug)) continue;
    recallInStartedWeeks += week.recall.length;
    week.recall.forEach((item, itemIndex) => {
      const stored = reviews.get(reviewKey(week.slug, itemIndex));
      const samePrompt = stored?.prompt === item.question;
      if (samePrompt && stored.nextReviewAt.getTime() > input.now.getTime()) return;
      due.push({
        weekSlug: week.slug,
        weekId: week.id,
        weekLabel: weekLabel(week),
        itemIndex,
        question: item.question,
        answer: item.answer,
        reviewCount: samePrompt ? stored.reviewCount : 0,
      });
    });
  }

  const limit = input.limit ?? due.length;
  return {
    due: due.slice(0, limit),
    waiting: Math.max(0, due.length - limit),
    startedCount: input.startedSlugs.size,
    recallInStartedWeeks,
  };
}
