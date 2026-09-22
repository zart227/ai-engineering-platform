import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { week01 } from "../course/weeks/week-01";
import { week02 } from "../course/weeks/week-02";
import {
  saveArtifactAction,
  toggleLabAction,
  toggleLessonAction,
  togglePracticeAction,
} from "../src/app/actions/learn";

describe("learn toggle actions", () => {
  it("toggleLessonAction rejects a foreign lesson before auth", async () => {
    const result = await toggleLessonAction(week02.lessons[0].id, week01.slug, true);
    assert.deepEqual(result, { ok: false, error: "Урок не найден." });
  });

  it("toggleLessonAction rejects an unknown lesson id", async () => {
    const result = await toggleLessonAction("missing-lesson", week01.slug, true);
    assert.deepEqual(result, { ok: false, error: "Урок не найден." });
  });

  it("toggleLabAction rejects a foreign lab id", async () => {
    const result = await toggleLabAction(week02.lab.id, week01.slug, true);
    assert.deepEqual(result, { ok: false, error: "Лабораторная не найдена." });
  });

  it("togglePracticeAction rejects a foreign exercise id", async () => {
    const result = await togglePracticeAction(week02.practice.id, week01.slug, true);
    assert.deepEqual(result, { ok: false, error: "Упражнение не найдено." });
  });

  it("saveArtifactAction rejects an unknown week slug", async () => {
    const result = await saveArtifactAction({
      weekSlug: "not-a-real-week",
      notes: "n",
      githubUrl: "",
      demoUrl: "",
      completed: true,
    });
    assert.deepEqual(result, { ok: false, error: "Неделя не найдена." });
  });

  it("saveArtifactAction rejects completed=true without a repository link", async () => {
    const result = await saveArtifactAction({
      weekSlug: week01.slug,
      notes: "notes only",
      githubUrl: "",
      demoUrl: "",
      completed: true,
    });
    assert.deepEqual(result, { ok: false, error: "Укажите ссылку на репозиторий." });
  });
});
