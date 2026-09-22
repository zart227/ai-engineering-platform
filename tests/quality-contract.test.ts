import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weeks } from "../course";
import type { ArtifactRubric, CourseSource, Week } from "../course/types";

const sourceKinds = new Set(["official-docs", "paper", "reference"]);

function assertArtifactRubric(slug: string, rubric: ArtifactRubric | undefined) {
  assert.ok(rubric, `${slug} artifactRubric`);
  assert.ok(Array.isArray(rubric.criteria) && rubric.criteria.length > 0, `${slug} rubric criteria`);
  let sum = 0;
  for (const criterion of rubric.criteria) {
    assert.ok(criterion.weight > 0, `${slug} ${criterion.id} weight must be positive`);
    sum += criterion.weight;
  }
  assert.equal(sum, 100, `${slug} rubric weights must sum to 100`);
}

function assertCourseSources(slug: string, sources: CourseSource[] | undefined) {
  assert.ok(sources && sources.length > 0, `${slug} sources`);
  for (const source of sources) {
    assert.equal(typeof source.title, "string", `${slug} source title`);
    assert.ok(source.title.trim().length > 0, `${slug} source title`);
    assert.ok(source.url.startsWith("https://"), `${slug} source url ${source.url}`);
    assert.ok(sourceKinds.has(source.kind), `${slug} source kind ${source.kind}`);
    assert.equal(typeof source.checkedAt, "string", `${slug} source checkedAt`);
    assert.ok(!Number.isNaN(Date.parse(source.checkedAt)), `${slug} source checkedAt ${source.checkedAt}`);
  }
}

function assertReadyCore(week: {
  slug: string;
  status: Week["status"];
  learningObjectives?: Week["learningObjectives"];
  experiments?: Week["experiments"];
  failureModes?: Week["failureModes"];
  metrics?: Week["metrics"];
  artifactRubric?: Week["artifactRubric"];
  sources?: Week["sources"];
  contentVersion?: Week["contentVersion"];
  lastReviewedAt?: Week["lastReviewedAt"];
  quiz: { questions: unknown[] };
  securityNotes?: string[];
  privacyNotes?: string[];
  costNotes?: string[];
  productionNotes?: string[];
}) {
  if (week.status !== "ready") return;
  assert.ok(week.learningObjectives && week.learningObjectives.length > 0, `${week.slug} learningObjectives`);
  assert.ok(week.experiments && week.experiments.length > 0, `${week.slug} experiments`);
  assert.ok(week.failureModes && week.failureModes.length > 0, `${week.slug} failureModes`);
  assert.ok(week.metrics && week.metrics.length > 0, `${week.slug} metrics`);
  assert.equal(typeof week.contentVersion, "string");
  assert.ok(week.contentVersion && week.contentVersion.trim().length > 0, `${week.slug} contentVersion`);
  assert.equal(typeof week.lastReviewedAt, "string");
  assert.ok(week.lastReviewedAt && !Number.isNaN(Date.parse(week.lastReviewedAt)), `${week.slug} lastReviewedAt`);
  assertArtifactRubric(week.slug, week.artifactRubric);
  assertCourseSources(week.slug, week.sources);
  assert.ok(week.quiz.questions.length >= 8, `${week.slug} quiz`);
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
  it("requires core fields on every ready week", () => {
    assert.equal(weeks.length, 33);
    for (const week of weeks) {
      assert.equal(week.status, "ready", week.slug);
      assertReadyCore(week);
    }
  });

  it("checks rubric and source shape", () => {
    assertArtifactRubric("fixture", validRubric);
    assertCourseSources("fixture", [validSource]);
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
    assert.throws(() => assertCourseSources("fixture", [{ ...validSource, title: "  " }]));
    assert.throws(() => assertCourseSources("fixture", [{ ...validSource, url: "http://example.com/docs" }]));
    assert.throws(() =>
      assertCourseSources("fixture", [{ ...validSource, kind: "blog" as CourseSource["kind"] }])
    );
    assert.throws(() => assertCourseSources("fixture", [{ ...validSource, checkedAt: "not-a-date" }]));
    assert.throws(() => assertArtifactRubric("fixture", undefined));
    assert.throws(() => assertCourseSources("fixture", undefined));
  });

  it("still loads an outlined week when core quality fields are omitted", () => {
    assertReadyCore({
      slug: "outlined-fixture",
      status: "outlined",
      quiz: { questions: [] },
    });
    assert.equal(weeks.length, 33);
  });

  it("does not require context notes on a ready week", () => {
    const week = weeks[0];
    assertReadyCore({
      ...week,
      securityNotes: undefined,
      privacyNotes: undefined,
      costNotes: undefined,
      productionNotes: undefined,
    });
  });

  it("rejects a ready week that drops a core field", () => {
    const week = weeks[0];
    assert.throws(() => assertReadyCore({ ...week, artifactRubric: undefined }));
    assert.throws(() => assertReadyCore({ ...week, sources: undefined }));
    assert.throws(() => assertReadyCore({ ...week, learningObjectives: [] }));
    assert.throws(() => assertReadyCore({ ...week, experiments: undefined }));
    assert.throws(() => assertReadyCore({ ...week, failureModes: undefined }));
    assert.throws(() => assertReadyCore({ ...week, metrics: undefined }));
    assert.throws(() => assertReadyCore({ ...week, contentVersion: "  " }));
    assert.throws(() => assertReadyCore({ ...week, lastReviewedAt: "not-a-date" }));
  });
});
