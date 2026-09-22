import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countFunnel, FUNNEL_EVENT_TYPES, FUNNEL_STEPS } from "../src/server/funnel";

const sampleEvents = [
  { userId: "me", type: "week_opened", weekSlug: "a" },
  { userId: "me", type: "lesson_started", weekSlug: "a" },
  { userId: "me", type: "lesson_started", weekSlug: "a" },
  { userId: "me", type: "lesson_completed", weekSlug: "a" },
  { userId: "me", type: "exercise_completed", weekSlug: "a" },
  { userId: "me", type: "exercise_completed", weekSlug: "a" },
  { userId: "me", type: "quiz_passed", weekSlug: "a" },
  { userId: "me", type: "artifact_completed", weekSlug: "a" },
  { userId: "me", type: "week_completed", weekSlug: "a" },
  { userId: "me", type: "exercise_completed", weekSlug: "b" },
  { userId: "me", type: "exercise_completed", weekSlug: "b" },
  { userId: "me", type: "lab_completed", weekSlug: "b" },
  { userId: "other", type: "week_opened", weekSlug: "a" },
  { userId: "other", type: "lesson_started", weekSlug: "a" },
  { userId: "me", type: "hint_requested", weekSlug: "a" },
  { userId: "me", type: "project_updated" },
];

function dedupeFunnelRows(events: { userId: string; type: string; weekSlug?: string | null }[]) {
  const seen = new Set<string>();
  const rows: { userId: string; type: string; weekSlug: string }[] = [];
  for (const event of events) {
    if (!(FUNNEL_EVENT_TYPES as readonly string[]).includes(event.type) || !event.weekSlug) continue;
    const key = `${event.userId}\n${event.weekSlug}\n${event.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ userId: event.userId, type: event.type, weekSlug: event.weekSlug });
  }
  return rows;
}

describe("loadLearningFunnel query bounds", () => {
  it("FUNNEL_EVENT_TYPES covers every step type", () => {
    const fromSteps = new Set(FUNNEL_STEPS.flatMap((step) => step.types));
    assert.deepEqual(new Set(FUNNEL_EVENT_TYPES), fromSteps);
  });

  it("deduped funnel rows match full history stage counts", () => {
    const full = countFunnel(sampleEvents, "me");
    const bounded = countFunnel(dedupeFunnelRows(sampleEvents), "me");

    assert.deepEqual(
      bounded.steps.map((step) => step.count),
      full.steps.map((step) => step.count)
    );
    assert.deepEqual(
      bounded.steps.map((step) => step.conversion),
      full.steps.map((step) => step.conversion)
    );
    assert.deepEqual(
      bounded.steps.map((step) => step.dropout),
      full.steps.map((step) => step.dropout)
    );
  });

  it("deduped funnel rows ignore non-funnel noise events", () => {
    const rows = dedupeFunnelRows(sampleEvents).filter((row) => row.userId === "me");
    assert.equal(rows.length, 8);
    assert.ok(!rows.some((row) => row.type === "hint_requested"));
    assert.ok(!rows.some((row) => row.type === "lab_completed"));
    assert.ok(!rows.some((row) => row.type === "project_updated"));
  });

  it("bounded rows set eventCount to distinct funnel pairs only", () => {
    const snapshot = countFunnel(dedupeFunnelRows(sampleEvents), "me");
    assert.equal(snapshot.eventCount, 8);
  });
});
