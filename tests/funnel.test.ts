import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countFunnel, FUNNEL_STEPS } from "../src/server/funnel";

describe("learning funnel", () => {
  it("counts only this user's rows, in funnel order", () => {
    const snapshot = countFunnel(
      [
        { userId: "me", type: "lesson_started" },
        { userId: "me", type: "lesson_started" },
        { userId: "other", type: "lesson_started" },
        { userId: "me", type: "lesson_completed" },
        { userId: "me", type: "exercise_started" },
        { userId: "me", type: "lab_completed" },
        { userId: "other", type: "lab_completed" },
        { userId: "me", type: "exercise_completed" },
        { userId: "me", type: "lab_started" },
        { userId: "me", type: "quiz_attempted" },
        { userId: "me", type: "quiz_passed" },
        { userId: "me", type: "artifact_completed" },
        { userId: "me", type: "hint_requested" },
        { userId: "me", type: "solution_viewed" },
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
      [2, 1, 2, 1, 1]
    );
    assert.equal(snapshot.eventCount, 13);
    assert.equal(snapshot.steps[2]?.label, "Практика или лаба");
  });

  it("is empty when the user has no events", () => {
    const snapshot = countFunnel(
      [{ userId: "other", type: "lesson_started" }],
      "me"
    );
    assert.equal(snapshot.eventCount, 0);
    assert.deepEqual(
      snapshot.steps.map((step) => step.count),
      [0, 0, 0, 0, 0]
    );
  });
});
