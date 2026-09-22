import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { week01 } from "../course/weeks/week-01";
import { week02 } from "../course/weeks/week-02";
import {
  validateArtifactCompletion,
  validateLabCompletion,
  validateLabInWeek,
  validateLessonCompletion,
  validateLessonInWeek,
  validatePracticeAnswerFields,
  validatePracticeCompletion,
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

  it("allows unchecking a lesson without extra checks", () => {
    const result = validateLessonCompletion(week01, false);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects lesson completion when the week has no lessons", () => {
    const emptyWeek = { ...week01, lessons: [] };
    const result = validateLessonCompletion(emptyWeek, true);
    assert.deepEqual(result, { ok: false, error: "В этой неделе нет уроков." });
  });

  it("allows lesson completion when lessons exist", () => {
    const result = validateLessonCompletion(week01, true);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects lab completion when the lab has no steps", () => {
    const weekWithoutSteps = { ...week01, lab: { ...week01.lab, steps: [] } };
    const result = validateLabCompletion(weekWithoutSteps, true);
    assert.deepEqual(result, { ok: false, error: "Лабораторная не настроена." });
  });

  it("allows lab completion when the lab is configured", () => {
    const result = validateLabCompletion(week01, true);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects practice completion when the exercise is not configured", () => {
    const weekWithoutPractice = {
      ...week01,
      practice: { ...week01.practice, requirements: [] },
    };
    const result = validatePracticeCompletion(weekWithoutPractice, week01.practice.id, true);
    assert.deepEqual(result, { ok: false, error: "Упражнение не настроено." });
  });

  it("allows practice completion when the exercise exists in the week", () => {
    const result = validatePracticeCompletion(week01, week01.practice.id, true);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects practice completion without a saved draft", () => {
    const result = validatePracticeAnswerFields(true, null);
    assert.deepEqual(result, { ok: false, error: "Сначала сохраните черновик практики." });
  });

  it("rejects practice completion when the saved draft is empty", () => {
    const result = validatePracticeAnswerFields(true, { body: "", githubUrl: "", resultUrl: "" });
    assert.deepEqual(result, { ok: false, error: "Сначала сохраните черновик практики." });
  });

  it("allows practice completion when any answer field is non-empty", () => {
    const result = validatePracticeAnswerFields(true, {
      body: "",
      githubUrl: "https://github.com/example/repo",
      resultUrl: "",
    });
    assert.deepEqual(result, { ok: true });
  });

  it("rejects artifact completion without a repository link", () => {
    const result = validateArtifactCompletion(true, {
      notes: "done",
      githubUrl: "",
      demoUrl: "https://demo.example",
    });
    assert.deepEqual(result, { ok: false, error: "Укажите ссылку на репозиторий." });
  });

  it("allows artifact completion when the repository link is present", () => {
    const result = validateArtifactCompletion(true, {
      notes: "",
      githubUrl: "https://github.com/example/repo",
      demoUrl: "",
    });
    assert.deepEqual(result, { ok: true });
  });
});
