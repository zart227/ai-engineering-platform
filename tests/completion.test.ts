import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreQuiz, weekComplete, weekParts, weekPercent } from "../course/completion";
import { week01 } from "../course/weeks/week-01";

describe("week completion", () => {
  it("does not reach 100% without artifact and quiz", () => {
    const parts = weekParts(week01, {
      completedLessons: new Set(week01.lessons.map((lesson) => lesson.id)),
      labDone: true,
      practiceDone: true,
      artifactDone: false,
      quizPassed: true,
    });
    assert.equal(weekComplete(parts), false);
    assert.ok(weekPercent(parts) < 100);
  });

  it("is complete only when every pillar is done", () => {
    const parts = weekParts(week01, {
      completedLessons: new Set(week01.lessons.map((lesson) => lesson.id)),
      labDone: true,
      practiceDone: true,
      artifactDone: true,
      quizPassed: true,
    });
    assert.equal(weekComplete(parts), true);
    assert.equal(weekPercent(parts), 100);
  });
});

describe("quiz scoring", () => {
  it("passes at 70%", () => {
    const result = scoreQuiz([0, 1, 1], [0, 1, 2]);
    assert.equal(result.score, 67);
    assert.equal(result.passed, false);
  });

  it("counts exact matches", () => {
    const result = scoreQuiz([1, 1, 1, 1, 1], [1, 1, 1, 1, 1]);
    assert.equal(result.score, 100);
    assert.equal(result.passed, true);
  });
});
