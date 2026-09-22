import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weeks } from "../course";
import type { ArtifactRubric, CourseSource } from "../course/types";

const sourceKinds = new Set(["official-docs", "paper", "reference"]);

function assertArtifactRubric(slug: string, rubric: ArtifactRubric | undefined) {
  if (!rubric) return;
  assert.ok(Array.isArray(rubric.criteria), `${slug} rubric criteria`);
  let sum = 0;
  for (const criterion of rubric.criteria) {
    assert.ok(criterion.weight > 0, `${slug} ${criterion.id} weight must be positive`);
    sum += criterion.weight;
  }
  assert.equal(sum, 100, `${slug} rubric weights must sum to 100`);
}

function assertCourseSources(slug: string, sources: CourseSource[] | undefined) {
  if (!sources) return;
  for (const source of sources) {
    assert.equal(typeof source.title, "string", `${slug} source title`);
    assert.ok(source.title.trim().length > 0, `${slug} source title`);
    assert.ok(source.url.startsWith("https://"), `${slug} source url ${source.url}`);
    assert.ok(sourceKinds.has(source.kind), `${slug} source kind ${source.kind}`);
    assert.equal(typeof source.checkedAt, "string", `${slug} source checkedAt`);
    assert.ok(!Number.isNaN(Date.parse(source.checkedAt)), `${slug} source checkedAt ${source.checkedAt}`);
  }
}

const validRubric: ArtifactRubric = {
  criteria: [
    { id: "result", name: "Result", weight: 40, evidence: "demo" },
    { id: "tests", name: "Tests", weight: 60, evidence: "suite" },
  ],
};

const validSource: CourseSource = {
  title: "Official docs",
  url: "https://example.com/docs",
  kind: "official-docs",
  checkedAt: "2026-09-21",
};

describe("course quality contract", () => {
  it("requires positive artifact rubric weights that sum to 100 when a rubric is present", () => {
    for (const week of weeks) {
      assertArtifactRubric(week.slug, week.artifactRubric);
    }
    assertArtifactRubric("fixture", validRubric);
    assert.throws(() =>
      assertArtifactRubric("fixture", {
        criteria: [{ id: "empty", name: "Empty", weight: 0, evidence: "none" }],
      })
    );
    assert.throws(() =>
      assertArtifactRubric("fixture", {
        criteria: [{ id: "partial", name: "Partial", weight: 40, evidence: "demo" }],
      })
    );
  });

  it("requires titled https sources with a kind and a parseable checkedAt when sources are present", () => {
    for (const week of weeks) {
      assertCourseSources(week.slug, week.sources);
    }
    assertCourseSources("fixture", [validSource]);
    assert.throws(() =>
      assertCourseSources("fixture", [{ ...validSource, title: "  " }])
    );
    assert.throws(() =>
      assertCourseSources("fixture", [{ ...validSource, url: "http://example.com/docs" }])
    );
    assert.throws(() =>
      assertCourseSources("fixture", [{ ...validSource, kind: "blog" as CourseSource["kind"] }])
    );
    assert.throws(() =>
      assertCourseSources("fixture", [{ ...validSource, checkedAt: "not-a-date" }])
    );
  });

  it("loads every week when the optional quality fields are omitted", () => {
    assert.equal(weeks.length, 33);
    assertArtifactRubric("omitted", undefined);
    assertCourseSources("omitted", undefined);
  });
});
