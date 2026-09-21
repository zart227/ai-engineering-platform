import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { modules, weeks } from "../course";
import { glossary } from "../course/glossary";
import { automationPath, engineeringPath, productPath } from "../course/learning-map";

const readyWeekMarkers = ["TODO", "FIXME", "placeholder", "coming soon"];

function readyWeekMarker(weekJson: string) {
  const ascii = readyWeekMarkers.find((marker) => new RegExp(`\\b${marker}\\b`, "i").test(weekJson));
  if (ascii) return ascii;
  if (weekJson.toLowerCase().includes("скоро будет")) return "скоро будет";
  return undefined;
}

describe("curriculum integrity", () => {
  it("covers week ids 1 through 33 exactly once", () => {
    const ids = weeks.map((week) => week.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual([...ids].sort((a, b) => a - b), Array.from({ length: 33 }, (_, index) => index + 1));
  });

  it("keeps week slugs unique", () => {
    const slugs = weeks.map((week) => week.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("links every week to a curriculum module and every module slug to a week", () => {
    const moduleIds = new Set(modules.map((module) => module.id));
    const slugs = new Set(weeks.map((week) => week.slug));
    for (const week of weeks) {
      assert.ok(moduleIds.has(week.moduleId), `${week.slug} moduleId ${week.moduleId}`);
    }
    for (const courseModule of modules) {
      for (const slug of courseModule.weekSlugs) {
        assert.ok(slugs.has(slug), `${courseModule.id} week slug ${slug}`);
      }
    }
  });

  it("keeps quiz pass scores, options, and answer indexes in range", () => {
    for (const week of weeks) {
      assert.equal(typeof week.quiz.passScore, "number");
      assert.ok(week.quiz.passScore >= 0 && week.quiz.passScore <= 100);
      assert.ok(week.quiz.questions.length >= 4);
      const questionIds = week.quiz.questions.map((question) => question.id);
      assert.equal(new Set(questionIds).size, questionIds.length, week.slug);
      for (const question of week.quiz.questions) {
        assert.ok(question.options.length >= 2, `${week.slug} ${question.id}`);
        assert.ok(
          Number.isInteger(question.answer) &&
            question.answer >= 0 &&
            question.answer < question.options.length,
          `${week.slug} ${question.id}`
        );
      }
    }
  });

  it("keeps at least three lessons per week and unique lesson ids", () => {
    const lessonIds: string[] = [];
    for (const week of weeks) {
      assert.ok(week.lessons.length >= 3, week.slug);
      lessonIds.push(...week.lessons.map((lesson) => lesson.id));
    }
    assert.equal(new Set(lessonIds).size, lessonIds.length);
  });

  it("keeps unfinished markers out of ready weeks", () => {
    for (const week of weeks) {
      if (week.status !== "ready") continue;
      const marker = readyWeekMarker(JSON.stringify(week));
      assert.equal(marker, undefined, `${week.slug} contains ${marker}`);
    }
  });

  it("resolves glossary related term ids", () => {
    const termIds = new Set(glossary.map((term) => term.id));
    for (const term of glossary) {
      for (const relatedId of term.related) {
        assert.ok(termIds.has(relatedId), `${term.id} related ${relatedId}`);
      }
    }
  });

  it("points learning-map week slugs at real weeks", () => {
    const slugs = new Set(weeks.map((week) => week.slug));
    for (const node of [...engineeringPath, ...automationPath, ...productPath]) {
      if (!node.weekSlug) continue;
      assert.ok(slugs.has(node.weekSlug), node.id);
    }
  });
});
