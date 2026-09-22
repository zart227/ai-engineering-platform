import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  intervalDays,
  nextReviewAt,
  selectDueRecall,
  startedWeekSlugs,
  type StoredRecallReview,
  type WeekRecallSource,
} from "../src/server/recall-schedule";

const now = new Date("2026-09-22T12:00:00.000Z");

const weeks: WeekRecallSource[] = [
  {
    slug: "how-llms-work",
    id: 2,
    recall: [
      { question: "Зачем фиксировать prompt?", answer: "Иначе это не сравнение." },
      { question: "Что режет JSON?", answer: "Лимит токенов." },
    ],
  },
  {
    slug: "capstone",
    id: 33,
    recall: [{ question: "Что считать второй итерацией?", answer: "Тот же набор, другой рычаг." }],
  },
  {
    slug: "environment-llm-api",
    id: 1,
    recall: [{ question: "Где живёт ключ?", answer: "На сервере." }],
  },
];

function review(partial: Partial<StoredRecallReview> & Pick<StoredRecallReview, "weekSlug" | "itemIndex">): StoredRecallReview {
  return {
    prompt: "Зачем фиксировать prompt?",
    nextReviewAt: new Date("2026-09-23T12:00:00.000Z"),
    reviewCount: 1,
    ...partial,
  };
}

describe("due recall", () => {
  it("shows prompts from started weeks and labels the capstone", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["how-llms-work", "capstone"]),
      reviews: [],
      now,
    });
    assert.deepEqual(
      result.due.map((item) => item.weekSlug),
      ["how-llms-work", "how-llms-work", "capstone"]
    );
    assert.equal(result.due[2]?.weekLabel, "Финальный проект");
    assert.notEqual(result.due[2]?.weekLabel, "Неделя 33");
    assert.equal(result.due[0]?.weekLabel, "Неделя 2");
  });

  it("hides a review whose next time is still ahead", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["how-llms-work"]),
      reviews: [review({ weekSlug: "how-llms-work", itemIndex: 0 })],
      now,
    });
    assert.deepEqual(
      result.due.map((item) => item.itemIndex),
      [1]
    );
  });

  it("keeps a missed review due", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["how-llms-work"]),
      reviews: [
        review({
          weekSlug: "how-llms-work",
          itemIndex: 0,
          nextReviewAt: new Date("2026-09-21T12:00:00.000Z"),
        }),
      ],
      now,
    });
    assert.equal(result.due[0]?.itemIndex, 0);
    assert.equal(result.due[0]?.question, "Зачем фиксировать prompt?");
  });

  it("treats the exact due instant as still due", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["how-llms-work"]),
      reviews: [review({ weekSlug: "how-llms-work", itemIndex: 0, nextReviewAt: now })],
      now,
    });
    assert.equal(result.due.some((item) => item.itemIndex === 0), true);
  });

  it("does not pull recall from a week that was not started", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["environment-llm-api"]),
      reviews: [
        review({
          weekSlug: "how-llms-work",
          itemIndex: 0,
          nextReviewAt: new Date("2026-09-01T00:00:00.000Z"),
        }),
      ],
      now,
    });
    assert.deepEqual(
      result.due.map((item) => item.weekSlug),
      ["environment-llm-api"]
    );
  });

  it("becomes due again when the prompt text changes", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["how-llms-work"]),
      reviews: [
        review({
          weekSlug: "how-llms-work",
          itemIndex: 0,
          prompt: "Старый вопрос",
          nextReviewAt: new Date("2026-10-01T00:00:00.000Z"),
        }),
      ],
      now,
    });
    assert.equal(result.due[0]?.itemIndex, 0);
    assert.equal(result.due[0]?.reviewCount, 0);
  });

  it("keeps the overflow due", () => {
    const result = selectDueRecall({
      weeks,
      startedSlugs: new Set(["how-llms-work", "capstone", "environment-llm-api"]),
      reviews: [],
      now,
      limit: 1,
    });
    assert.equal(result.due.length, 1);
    assert.equal(result.due[0]?.weekSlug, "environment-llm-api");
    assert.equal(result.waiting, 3);
  });
});

describe("review interval", () => {
  it("moves the next time forward only when a review is recorded", () => {
    assert.deepEqual(
      [1, 2, 3, 4, 5].map((count) => intervalDays(count)),
      [1, 3, 7, 21, 21]
    );
    const scheduled = nextReviewAt(1, now);
    assert.equal(scheduled.toISOString(), "2026-09-23T12:00:00.000Z");
  });
});

describe("started weeks", () => {
  it("unions progress rows from every activity table", () => {
    const slugs = startedWeekSlugs([
      [{ weekSlug: "how-llms-work" }],
      [],
      [{ weekSlug: "capstone" }],
    ]);
    assert.equal(slugs.has("how-llms-work"), true);
    assert.equal(slugs.has("capstone"), true);
    assert.equal(slugs.has("environment-llm-api"), false);
  });
});
