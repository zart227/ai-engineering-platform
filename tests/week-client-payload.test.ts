import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weeks } from "../course";
import { toWeekClientPayload } from "../src/server/week-client-payload";

describe("week client payload", () => {
  it("omits practice.solution and quiz answer keys from every week", () => {
    for (const week of weeks) {
      const payload = toWeekClientPayload(week);
      assert.equal("solution" in payload.practice, false);
      for (const question of payload.quiz.questions) {
        assert.equal("answer" in question, false);
        assert.equal("explanation" in question, false);
      }
    }
  });

  it("keeps serialized payload free of quiz keys and practice solution fields", () => {
    for (const week of weeks) {
      const serialized = JSON.stringify(toWeekClientPayload(week));
      const parsed = JSON.parse(serialized) as {
        practice: Record<string, unknown>;
        quiz: { questions: Record<string, unknown>[] };
      };

      assert.equal("solution" in parsed.practice, false);
      assert.ok(!serialized.includes('"solution"'));
      for (const question of parsed.quiz.questions) {
        assert.equal("answer" in question, false);
        assert.equal("explanation" in question, false);
      }
      assert.ok(!/"answer"\s*:/.test(serialized));
    }
  });
});
