export const FUNNEL_STEPS = [
  { id: "week_opened", label: "Неделя открыта", types: ["week_opened"] },
  { id: "lesson_started", label: "Урок начат", types: ["lesson_started"] },
  { id: "lesson_completed", label: "Урок завершён", types: ["lesson_completed"] },
  { id: "practice_completed", label: "Практика завершена", types: ["practice_completed", "exercise_completed"] },
  { id: "quiz_passed", label: "Квиз сдан", types: ["quiz_passed"] },
  { id: "artifact_completed", label: "Артефакт готов", types: ["artifact_completed"] },
  { id: "week_completed", label: "Неделя завершена", types: ["week_completed"] },
] as const;

/** Event types that affect funnel stage counts; used to bound home-page reads. */
export const FUNNEL_EVENT_TYPES = [...new Set(FUNNEL_STEPS.flatMap((step) => step.types))];

export type FunnelStepId = (typeof FUNNEL_STEPS)[number]["id"];

export type FunnelStep = {
  id: FunnelStepId;
  label: string;
  count: number;
  conversion: number | null;
  dropout: number;
  dropoutRate: number | null;
};

export type FunnelSnapshot = {
  steps: FunnelStep[];
  eventCount: number;
  unit: "user-week";
};

export type FunnelEvent = {
  userId: string;
  type: string;
  weekSlug?: string | null;
};

const PRACTICE_STAGE_INDEX = FUNNEL_STEPS.findIndex((step) => step.id === "practice_completed");
const QUIZ_STAGE_INDEX = FUNNEL_STEPS.findIndex((step) => step.id === "quiz_passed");

function weekKey(userId: string, weekSlug: string) {
  return `${userId}\n${weekSlug}`;
}

function hasReachedStage(stages: Set<number>, index: number) {
  if (index <= PRACTICE_STAGE_INDEX) {
    for (let cursor = 0; cursor <= index; cursor += 1) {
      if (!stages.has(cursor)) return false;
    }
    return true;
  }

  for (let cursor = 0; cursor < PRACTICE_STAGE_INDEX; cursor += 1) {
    if (!stages.has(cursor)) return false;
  }
  for (let cursor = PRACTICE_STAGE_INDEX + 1; cursor <= index; cursor += 1) {
    if (!stages.has(cursor)) return false;
  }
  return true;
}

function conversionBaseline(counts: number[], index: number) {
  if (index === 0) return null;
  if (index === QUIZ_STAGE_INDEX) return counts[PRACTICE_STAGE_INDEX - 1];
  return counts[index - 1];
}

export function countFunnel(events: FunnelEvent[], userId: string): FunnelSnapshot {
  const reached = new Map<string, Set<number>>();
  let eventCount = 0;
  for (const event of events) {
    if (event.userId !== userId) continue;
    eventCount += 1;
    if (!event.weekSlug) continue;
    const stage = FUNNEL_STEPS.findIndex((step) => (step.types as readonly string[]).includes(event.type));
    if (stage < 0) continue;
    const key = weekKey(userId, event.weekSlug);
    const stages = reached.get(key) ?? new Set<number>();
    stages.add(stage);
    reached.set(key, stages);
  }

  const counts = FUNNEL_STEPS.map((_, index) => {
    let count = 0;
    for (const stages of reached.values()) {
      if (hasReachedStage(stages, index)) count += 1;
    }
    return count;
  });

  return {
    eventCount,
    unit: "user-week",
    steps: FUNNEL_STEPS.map((step, index) => {
      const previous = conversionBaseline(counts, index);
      return {
        id: step.id,
        label: step.label,
        count: counts[index],
        conversion: previous && previous > 0 ? counts[index] / previous : null,
        dropout: previous === null ? 0 : previous - counts[index],
        dropoutRate: previous && previous > 0 ? (previous - counts[index]) / previous : null,
      };
    }),
  };
}
