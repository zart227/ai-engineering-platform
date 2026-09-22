import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countFunnel, FUNNEL_STEPS } from "../src/server/funnel";

describe("learning funnel", () => {
  it("counts user-weeks in order and does not let a later event overtake", () => {
    const snapshot = countFunnel(
      [
        { userId: "me", type: "week_opened", weekSlug: "a" },
        { userId: "me", type: "lesson_started", weekSlug: "a" },
        { userId: "me", type: "lesson_started", weekSlug: "a" },
        { userId: "me", type: "lesson_completed", weekSlug: "a" },
        { userId: "me", type: "exercise_completed", weekSlug: "a" },
        { userId: "me", type: "exercise_completed", weekSlug: "a" },
        { userId: "me", type: "quiz_passed", weekSlug: "a" },
        { userId: "me", type: "artifact_completed", weekSlug: "a" },
        { userId: "me", type: "week_completed", weekSlug: "a" },
        { userId: "me", type: "exercise_completed", weekSlug: "b" },
        { userId: "me", type: "exercise_completed", weekSlug: "b" },
        { userId: "me", type: "lab_completed", weekSlug: "b" },
        { userId: "other", type: "week_opened", weekSlug: "a" },
        { userId: "other", type: "lesson_started", weekSlug: "a" },
        { userId: "me", type: "hint_requested", weekSlug: "a" },
        { userId: "me", type: "project_updated" },
      ],
      "me"
    );

    assert.deepEqual(
      snapshot.steps.map((step) => step.id),
      FUNNEL_STEPS.map((step) => step.id)
    );
    assert.deepEqual(
      snapshot.steps.map((step) => step.count),
      [1, 1, 1, 1, 1, 1, 1]
    );
    assert.equal(snapshot.unit, "user-week");
    assert.equal(snapshot.eventCount, 14);
    assert.equal(snapshot.steps[3]?.label, "Практика завершена");
    assert.equal(snapshot.steps[1]?.conversion, 1);
    assert.equal(snapshot.steps[1]?.dropout, 0);
    assert.ok(snapshot.steps.every((step, index) => index === 0 || step.count <= snapshot.steps[index - 1].count));
  });

  it("drops a week that skipped an earlier stage", () => {
    const snapshot = countFunnel(
      [
        { userId: "me", type: "week_opened", weekSlug: "a" },
        { userId: "me", type: "lesson_started", weekSlug: "a" },
        { userId: "me", type: "practice_completed", weekSlug: "a" },
      ],
      "me"
    );
    assert.deepEqual(
      snapshot.steps.map((step) => step.count),
      [1, 1, 0, 0, 0, 0, 0]
    );
    assert.equal(snapshot.steps[2]?.dropout, 1);
    assert.equal(snapshot.steps[2]?.conversion, 0);
  });

  it("is empty when the user has no ordered weeks", () => {
    const snapshot = countFunnel([{ userId: "other", type: "week_opened", weekSlug: "a" }], "me");
    assert.equal(snapshot.eventCount, 0);
    assert.deepEqual(
      snapshot.steps.map((step) => step.count),
      [0, 0, 0, 0, 0, 0, 0]
    );
  });
});
