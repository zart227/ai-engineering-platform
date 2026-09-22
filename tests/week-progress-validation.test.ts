import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { week01 } from "../course/weeks/week-01";
import { week02 } from "../course/weeks/week-02";
import {
  validateLabInWeek,
  validateLessonInWeek,
  validatePracticeInWeek,
  validateWeekSlug,
} from "../src/server/week-progress-validation";

describe("week progress validation", () => {
  it("accepts a known week slug", () => {
    const result = validateWeekSlug(week01.slug);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.week.slug, week01.slug);
  });

  it("rejects an unknown week slug", () => {
    const result = validateWeekSlug("not-a-real-week");
    assert.deepEqual(result, { ok: false, error: "Неделя не найдена." });
  });

  it("accepts a lesson that belongs to the claimed week", () => {
    const lessonId = week01.lessons[0].id;
    const result = validateLessonInWeek(week01.slug, lessonId);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.lessonId, lessonId);
  });

  it("rejects a lesson from another week", () => {
    const foreignLessonId = week02.lessons[0].id;
    const result = validateLessonInWeek(week01.slug, foreignLessonId);
    assert.deepEqual(result, { ok: false, error: "Урок не найден." });
  });

  it("rejects an unknown lesson id", () => {
    const result = validateLessonInWeek(week01.slug, "missing-lesson");
    assert.deepEqual(result, { ok: false, error: "Урок не найден." });
  });

  it("accepts the lab id for the claimed week", () => {
    const result = validateLabInWeek(week01.slug, week01.lab.id);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.labId, week01.lab.id);
  });

  it("rejects a lab id from another week", () => {
    const result = validateLabInWeek(week01.slug, week02.lab.id);
    assert.deepEqual(result, { ok: false, error: "Лабораторная не найдена." });
  });

  it("accepts the practice id for the claimed week", () => {
    const result = validatePracticeInWeek(week01.slug, week01.practice.id);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.exerciseId, week01.practice.id);
  });

  it("rejects a practice id from another week", () => {
    const result = validatePracticeInWeek(week01.slug, week02.practice.id);
    assert.deepEqual(result, { ok: false, error: "Упражнение не найдено." });
  });
});
