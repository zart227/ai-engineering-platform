import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("recall review actions", () => {
  it("passes recalled grade through the server action into saveRecallReview", () => {
    const action = readFileSync("src/app/actions/recall.ts", "utf8");
    assert.match(action, /recalled\s*=\s*true/);
    assert.match(action, /saveRecallReview\(user\.id,\s*weekSlug,\s*itemIndex,\s*recalled\)/);
  });

  it("exposes miss grading on the dashboard recall list", () => {
    const ui = readFileSync("src/components/recall-today.tsx", "utf8");
    assert.match(ui, /markRecallReviewedAction\(item\.weekSlug,\s*item\.itemIndex,\s*true\)/);
    assert.match(ui, /markRecallReviewedAction\(item\.weekSlug,\s*item\.itemIndex,\s*false\)/);
    assert.match(ui, /Не помню/);
  });

  it("uses nextReviewCountAfter in saveRecallReview", () => {
    const lab = readFileSync("src/server/learning-lab.ts", "utf8");
    assert.match(lab, /nextReviewCountAfter/);
    assert.match(lab, /recalled/);
  });
});
