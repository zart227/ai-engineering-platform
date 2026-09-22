import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { weeks } from "../course";
import { toWeekClientPayload } from "../src/server/week-client-payload";

describe("week workspace UI contract", () => {
  it("passes persisted hintsUsed from the week page into initial client state", () => {
    const page = readFileSync("src/app/week/[slug]/page.tsx", "utf8");
    assert.match(page, /exerciseProgress/);
    assert.match(page, /hintsUsed:\s*exerciseProgress\?\.hintsUsed\s*\?\?\s*0/);
  });

  it("restores practice hint ladder from hintsUsed instead of zero", () => {
    const ui = readFileSync("src/components/week-workspace.tsx", "utf8");
    assert.match(ui, /hintsUsed:\s*number/);
    const practice = ui.slice(ui.indexOf("function PracticePanel"), ui.indexOf("function ArtifactPanel"));
    assert.match(practice, /hintsUsed/);
    assert.match(practice, /useState\(hintsUsed\)/);
  });

  it("surfaces GATE 4 learningObjectives and artifactRubric in overview", () => {
    const ui = readFileSync("src/components/week-workspace.tsx", "utf8");
    const overview = ui.slice(ui.indexOf("function Overview"), ui.indexOf("function Meta"));
    assert.match(overview, /Цели обучения/);
    assert.match(overview, /week\.learningObjectives/);
    assert.match(overview, /Рубрика артефакта/);
    assert.match(overview, /week\.artifactRubric/);
    assert.match(overview, /criterion\.evidence/);
  });

  it("keeps contract fields on every ready week client payload", () => {
    for (const week of weeks.filter((item) => item.status === "ready")) {
      const payload = toWeekClientPayload(week);
      assert.ok(payload.learningObjectives && payload.learningObjectives.length > 0, week.slug);
      assert.ok(payload.artifactRubric && payload.artifactRubric.criteria.length > 0, week.slug);
    }
  });
});
