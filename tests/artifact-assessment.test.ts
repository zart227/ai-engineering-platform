import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { week01 } from "../course/weeks/week-01";
import {
  assessSelfCheck,
  isRubricSatisfiedForCompletion,
  MIN_CRITERION_EVIDENCE_CHARS,
  weekRequiresArtifactRubric,
} from "../src/server/artifact-assessment";

function passingChecks() {
  return week01.artifactRubric!.criteria.map((criterion) => ({
    criterionId: criterion.id,
    met: true,
    evidence: `Доказательство для ${criterion.name} в README и логах`,
  }));
}

describe("artifact assessment", () => {
  it("requires a rubric for ready week 1", () => {
    assert.equal(weekRequiresArtifactRubric(week01), true);
  });

  it("passes only when every criterion is met with evidence", () => {
    const result = assessSelfCheck(week01.slug, passingChecks());
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.passed, true);
    assert.equal(result.score, 100);
    assert.equal(result.source, "self_check");
  });

  it("rejects met criterion without enough evidence", () => {
    const checks = passingChecks();
    checks[0] = { ...checks[0], evidence: "short" };
    const result = assessSelfCheck(week01.slug, checks);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, new RegExp(String(MIN_CRITERION_EVIDENCE_CHARS)));
  });

  it("scores partial self-check without pass", () => {
    const checks = passingChecks().map((item, index) =>
      index === 0 ? { ...item, met: false, evidence: "" } : item
    );
    const result = assessSelfCheck(week01.slug, checks);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.passed, false);
    assert.equal(result.score, 75);
  });

  it("blocks week artifact pillar without rubric pass", () => {
    assert.equal(
      isRubricSatisfiedForCompletion({
        week: week01,
        artifactCompleted: true,
        assessmentPassed: false,
      }),
      false
    );
    assert.equal(
      isRubricSatisfiedForCompletion({
        week: week01,
        artifactCompleted: true,
        assessmentPassed: true,
      }),
      true
    );
  });
});
