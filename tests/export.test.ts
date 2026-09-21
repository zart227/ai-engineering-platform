import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ExportFormatError,
  exportSchema,
  exportSchemaV2,
  migrateExport,
  previewImport,
} from "../src/server/export";

const fullFixture = {
  formatVersion: 2 as const,
  exportedAt: "2026-09-21T12:00:00.000Z",
  user: { email: "ada@example.com", name: "Ada" },
  settings: { theme: "dark", locale: "ru" },
  capstone: {
    name: "Platform",
    oneLiner: "Learn",
    targetUser: "dev",
    problem: "p",
    hypothesis: "h",
    valueProposition: "v",
    assumptions: "a",
    competitors: "c",
    prd: "prd",
    architecture: "arch",
    stack: "ts",
    githubUrl: "https://github.com/example/repo",
    demoUrl: "https://example.com",
    analytics: "",
    notes: "",
  },
  portfolio: [
    {
      slug: "demo",
      title: "Demo",
      description: "desc",
      status: "done",
      stack: ["ts"],
      skills: ["zod"],
      githubUrl: "",
      demoUrl: "",
      readme: "# hi",
      weekSlug: "foundations",
    },
  ],
  notes: [
    {
      key: "n1",
      body: "hello",
      weekSlug: "foundations",
      lessonId: "l1",
      moduleId: "m01",
      tags: ["ai"],
    },
  ],
  bookmarks: [{ targetType: "lesson", targetId: "l1", title: "L", href: "/week/foundations" }],
  lessons: [{ lessonId: "l1", weekSlug: "foundations", completed: true }],
  labs: [{ labId: "lab1", weekSlug: "foundations", completed: false }],
  exercises: [
    {
      exerciseId: "e1",
      weekSlug: "foundations",
      completed: true,
      hintsUsed: 1,
      solutionViewed: false,
    },
  ],
  answers: [{ exerciseId: "e1", weekSlug: "foundations", body: "ans", githubUrl: "", resultUrl: "" }],
  artifacts: [{ weekSlug: "foundations", completed: true, githubUrl: "", demoUrl: "", notes: "" }],
  weekProgress: [{ weekSlug: "foundations", percent: 80, completed: false }],
  quizAttempts: [
    {
      weekSlug: "foundations",
      answers: [0, 1, 2],
      score: 2,
      passed: false,
      createdAt: "2026-09-21T12:00:00.000Z",
    },
  ],
  learningEvents: [
    {
      type: "lesson_completed",
      weekSlug: "foundations",
      lessonId: "l1",
      payload: { ok: true },
      createdAt: "2026-09-21T12:00:00.000Z",
    },
  ],
};

const minimalV1 = {
  version: 1 as const,
  exportedAt: "2026-01-02T03:04:05.000Z",
  user: { email: "ada@example.com", name: "Ada" },
  notes: [{ key: "k", body: "body" }],
  answers: [],
  artifacts: [],
  lessons: [],
  labs: [],
  exercises: [],
  bookmarks: [],
};

describe("export schema v2", () => {
  it("accepts a full fixture", () => {
    const parsed = exportSchemaV2.safeParse(fullFixture);
    assert.equal(parsed.success, true);
  });

  it("rejects a bare version 1 object that is missing required collections", () => {
    const parsed = exportSchemaV2.safeParse({ version: 1 });
    assert.equal(parsed.success, false);
  });

  it("keeps the legacy exportSchema on version literal 1", () => {
    assert.equal(exportSchema.safeParse({ version: 2 }).success, false);
    assert.equal(exportSchema.safeParse(minimalV1).success, true);
  });
});

describe("migrateExport", () => {
  it("maps a minimal v1 export onto v2 and fills missing collections", () => {
    const migrated = migrateExport(minimalV1);
    assert.equal(migrated.formatVersion, 2);
    assert.equal(migrated.exportedAt, minimalV1.exportedAt);
    assert.deepEqual(migrated.user, { email: "ada@example.com", name: "Ada" });
    assert.equal(migrated.settings, null);
    assert.deepEqual(migrated.portfolio, []);
    assert.deepEqual(migrated.weekProgress, []);
    assert.deepEqual(migrated.quizAttempts, []);
    assert.deepEqual(migrated.learningEvents, []);
    assert.equal(migrated.notes[0]?.key, "k");
    assert.equal(migrated.notes[0]?.moduleId, null);
    assert.equal("version" in migrated, false);
  });

  it("returns a v2 payload unchanged aside from stripped unknowns", () => {
    const migrated = migrateExport({
      ...fullFixture,
      portfolio: [{ ...fullFixture.portfolio[0], id: "db-id" }],
    });
    assert.equal(migrated.formatVersion, 2);
    assert.equal(migrated.portfolio.length, 1);
    assert.equal("id" in migrated.portfolio[0], false);
    assert.equal(migrated.notes[0]?.moduleId, "m01");
    assert.equal(migrated.quizAttempts[0]?.answers && Array.isArray(migrated.quizAttempts[0].answers), true);
  });

  it("drops passwordHash, tokenHash, and session from the migrated object", () => {
    const migrated = migrateExport({
      ...minimalV1,
      passwordHash: "super-secret-hash",
      tokenHash: "tok-secret",
      session: { token: "sess-secret" },
      ip: "203.0.113.5",
      userAgent: "curl",
      capstone: { name: "N", userId: "attacker", passwordHash: "cap-secret" },
      user: { email: "ada@example.com", name: "Ada", id: "attacker", passwordHash: "user-secret" },
    });
    const blob = JSON.stringify(migrated);
    assert.equal(blob.includes("passwordHash"), false);
    assert.equal(blob.includes("tokenHash"), false);
    assert.equal(blob.includes("super-secret-hash"), false);
    assert.equal(blob.includes("tok-secret"), false);
    assert.equal(blob.includes("sess-secret"), false);
    assert.equal(blob.includes("user-secret"), false);
    assert.equal(blob.includes("cap-secret"), false);
    assert.equal(blob.includes("attacker"), false);
    assert.equal(blob.includes("203.0.113.5"), false);
    assert.equal("session" in migrated, false);
    assert.equal(migrated.capstone.name, "N");
    assert.deepEqual(migrated.user, { email: "ada@example.com", name: "Ada" });
  });

  it("fails formatVersion 99", () => {
    assert.throws(() => migrateExport({ formatVersion: 99 }), ExportFormatError);
    assert.throws(() => migrateExport({ ...minimalV1, formatVersion: 99 }), ExportFormatError);
    assert.throws(() => migrateExport({ version: 1 }), ExportFormatError);
  });
});

describe("previewImport", () => {
  it("counts entities and warns that quizzes and events are replaced", () => {
    const preview = previewImport(migrateExport(fullFixture), fullFixture);
    assert.deepEqual(preview.counts, {
      capstone: 1,
      settings: 1,
      portfolio: 1,
      notes: 1,
      bookmarks: 1,
      lessons: 1,
      labs: 1,
      exercises: 1,
      answers: 1,
      artifacts: 1,
      weekProgress: 1,
      quizAttempts: 1,
      learningEvents: 1,
    });
    assert.match(preview.warnings.join(" "), /замен/i);
  });

  it("warns when secrets and unknown keys are stripped", () => {
    const raw = { ...minimalV1, passwordHash: "super-secret-hash", extraField: true };
    const preview = previewImport(migrateExport(raw), raw);
    const text = preview.warnings.join(" ");
    assert.match(text, /секрет/i);
    assert.match(text, /неизвестн/i);
    assert.match(text, /останутся/i);
    assert.doesNotMatch(text, /будут заменены/i);
  });
});
