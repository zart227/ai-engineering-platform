export const FUNNEL_STEPS = [
  { id: "lesson_started", label: "Урок начат", types: ["lesson_started"] },
  { id: "lesson_completed", label: "Урок завершён", types: ["lesson_completed"] },
  { id: "practice_or_lab", label: "Практика или лаба", types: ["exercise_started", "lab_completed"] },
  { id: "quiz_passed", label: "Квиз сдан", types: ["quiz_passed"] },
  { id: "artifact_completed", label: "Артефакт готов", types: ["artifact_completed"] },
] as const;

export type FunnelStepId = (typeof FUNNEL_STEPS)[number]["id"];

export type FunnelStep = {
  id: FunnelStepId;
  label: string;
  count: number;
};

export type FunnelSnapshot = {
  steps: FunnelStep[];
  eventCount: number;
};

export function funnelFromTypeCounts(
  byType: Readonly<Record<string, number>>,
  eventCount: number
): FunnelSnapshot {
  return {
    eventCount,
    steps: FUNNEL_STEPS.map((step) => ({
      id: step.id,
      label: step.label,
      count: step.types.reduce((sum, type) => sum + (byType[type] ?? 0), 0),
    })),
  };
}

export function countFunnel(
  events: { userId: string; type: string }[],
  userId: string
): FunnelSnapshot {
  const byType: Record<string, number> = {};
  let eventCount = 0;
  for (const event of events) {
    if (event.userId !== userId) continue;
    eventCount += 1;
    byType[event.type] = (byType[event.type] ?? 0) + 1;
  }
  return funnelFromTypeCounts(byType, eventCount);
}
