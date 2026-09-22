import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weeks } from "../course";
import { coursePercent, summarizeWeeks } from "../src/server/progress";

describe("progress summary", () => {
  it("summarizeWeeks and coursePercent work with slim progress input", () => {
    const firstWeek = weeks[0];

    const rows = summarizeWeeks({
      lessons: firstWeek.lessons.map((lesson) => ({
        lessonId: lesson.id,
        completedAt: new Date(),
      })),
      labs: [{ labId: firstWeek.lab.id, completedAt: new Date() }],
      exercises: [{ exerciseId: firstWeek.practice.id, completedAt: new Date() }],
      artifacts: [{ weekSlug: firstWeek.slug, completed: true }],
      quizzes: new Map([[firstWeek.slug, { passed: true }]]),
    });

    assert.equal(rows.length, weeks.length);
    const first = rows.find((row) => row.week.slug === firstWeek.slug);
    assert.ok(first);
    assert.equal(first.complete, true);
    assert.equal(first.percent, 100);
    assert.ok(coursePercent(rows) > 0);
  });

  it("treats missing quiz as not passed", () => {
    const week = weeks[0];
    const rows = summarizeWeeks({
      lessons: week.lessons.map((lesson) => ({ lessonId: lesson.id, completedAt: new Date() })),
      labs: [{ labId: week.lab.id, completedAt: new Date() }],
      exercises: [{ exerciseId: week.practice.id, completedAt: new Date() }],
      artifacts: [{ weekSlug: week.slug, completed: true }],
      quizzes: new Map(),
    });

    const row = rows.find((item) => item.week.slug === week.slug);
    assert.ok(row);
    assert.equal(row.parts.quiz, false);
    assert.equal(row.complete, false);
  });
});
