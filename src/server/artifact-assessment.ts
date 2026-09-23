import { getWeek } from "@course";
import type { ArtifactRubric, Week } from "@course/types";

/** V1 assessor: learner self-check with deterministic pass rules. No AI review. */
export const ASSESSMENT_SOURCE_SELF_CHECK = "self_check" as const;
export const ASSESSMENT_SOURCE_POLICY = "policy_approved" as const;

export type AssessmentSource =
  | typeof ASSESSMENT_SOURCE_SELF_CHECK
  | typeof ASSESSMENT_SOURCE_POLICY;

export const MIN_CRITERION_EVIDENCE_CHARS = 8;

export type CriterionSelfCheckInput = {
  criterionId: string;
  met: boolean;
  evidence: string;
};

export type CriterionResultView = {
  criterionId: string;
  name: string;
  weight: number;
  expectedEvidence: string;
  met: boolean;
  evidence: string;
};

export type AssessmentView = {
  weekSlug: string;
  source: AssessmentSource;
  score: number;
  passed: boolean;
  assessedAt: string | null;
  criteria: CriterionResultView[];
};

export type AssessSelfCheckResult =
  | {
      ok: true;
      score: number;
      passed: boolean;
      source: typeof ASSESSMENT_SOURCE_SELF_CHECK;
      criteria: Array<{
        criterionId: string;
        weight: number;
        met: boolean;
        evidence: string;
      }>;
    }
  | { ok: false; error: string };

function normalizeEvidence(value: string): string {
  return value.trim();
}

export function weekRequiresArtifactRubric(week: Week): boolean {
  return Boolean(week.artifactRubric && week.artifactRubric.criteria.length > 0);
}

export function isRubricSatisfiedForCompletion(input: {
  week: Week;
  artifactCompleted: boolean;
  assessmentPassed: boolean;
}): boolean {
  if (!input.artifactCompleted) return false;
  if (!weekRequiresArtifactRubric(input.week)) return true;
  return input.assessmentPassed;
}

export function computeWeightedScore(
  rubric: ArtifactRubric,
  checks: Map<string, { met: boolean; evidence: string }>
): number {
  let score = 0;
  for (const criterion of rubric.criteria) {
    const row = checks.get(criterion.id);
    if (!row?.met) continue;
    if (normalizeEvidence(row.evidence).length < MIN_CRITERION_EVIDENCE_CHARS) continue;
    score += criterion.weight;
  }
  return score;
}

export function assessSelfCheck(
  weekSlug: string,
  checks: CriterionSelfCheckInput[]
): AssessSelfCheckResult {
  const week = getWeek(weekSlug);
  if (!week) return { ok: false, error: "Неделя не найдена." };
  const rubric = week.artifactRubric;
  if (!rubric || rubric.criteria.length === 0) {
    return { ok: false, error: "У этой недели нет рубрики артефакта." };
  }

  const byId = new Map<string, CriterionSelfCheckInput>();
  for (const item of checks) {
    if (byId.has(item.criterionId)) {
      return { ok: false, error: "Дублируется критерий самооценки." };
    }
    byId.set(item.criterionId, item);
  }

  if (byId.size !== rubric.criteria.length) {
    return { ok: false, error: "Отметьте все критерии рубрики." };
  }

  for (const criterion of rubric.criteria) {
    if (!byId.has(criterion.id)) {
      return { ok: false, error: `Неизвестный или пропущенный критерий: ${criterion.id}.` };
    }
  }

  const normalized = rubric.criteria.map((criterion) => {
    const row = byId.get(criterion.id)!;
    const evidence = normalizeEvidence(row.evidence);
    const met = Boolean(row.met) && evidence.length >= MIN_CRITERION_EVIDENCE_CHARS;
    return {
      criterionId: criterion.id,
      weight: criterion.weight,
      met,
      evidence,
    };
  });

  for (const row of normalized) {
    const submitted = byId.get(row.criterionId)!;
    if (submitted.met && normalizeEvidence(submitted.evidence).length < MIN_CRITERION_EVIDENCE_CHARS) {
      return {
        ok: false,
        error: `Для выполненного критерия укажите доказательство (минимум ${MIN_CRITERION_EVIDENCE_CHARS} символов).`,
      };
    }
  }

  const score = normalized.reduce((sum, row) => sum + (row.met ? row.weight : 0), 0);
  const passed = score === 100 && normalized.every((row) => row.met);

  return {
    ok: true,
    score,
    passed,
    source: ASSESSMENT_SOURCE_SELF_CHECK,
    criteria: normalized,
  };
}

export function emptyAssessmentView(week: Week): AssessmentView | null {
  const rubric = week.artifactRubric;
  if (!rubric || rubric.criteria.length === 0) return null;
  return {
    weekSlug: week.slug,
    source: ASSESSMENT_SOURCE_SELF_CHECK,
    score: 0,
    passed: false,
    assessedAt: null,
    criteria: rubric.criteria.map((criterion) => ({
      criterionId: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      expectedEvidence: criterion.evidence,
      met: false,
      evidence: "",
    })),
  };
}

export function mergeAssessmentView(
  week: Week,
  stored: {
    source: string;
    score: number;
    passed: boolean;
    assessedAt: Date | null;
    criteria: Array<{ criterionId: string; met: boolean; evidence: string; weight: number }>;
  } | null
): AssessmentView | null {
  const base = emptyAssessmentView(week);
  if (!base) return null;
  if (!stored) return base;

  const byId = new Map(stored.criteria.map((row) => [row.criterionId, row]));
  return {
    weekSlug: week.slug,
    source:
      stored.source === ASSESSMENT_SOURCE_POLICY
        ? ASSESSMENT_SOURCE_POLICY
        : ASSESSMENT_SOURCE_SELF_CHECK,
    score: stored.score,
    passed: stored.passed,
    assessedAt: stored.assessedAt ? stored.assessedAt.toISOString() : null,
    criteria: base.criteria.map((criterion) => {
      const row = byId.get(criterion.criterionId);
      return {
        ...criterion,
        met: row?.met ?? false,
        evidence: row?.evidence ?? "",
      };
    }),
  };
}
