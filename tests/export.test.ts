import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ExportFormatError,
  exportSchema,
  exportSchemaV2,
  exportSchemaV3,
  importExport,
  importReplacesRecall,
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
    assert.equal(migrated.formatVersion, 3);
    assert.deepEqual(migrated.recallReviews, []);
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
    assert.equal(migrated.formatVersion, 3);
    assert.deepEqual(migrated.recallReviews, []);
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
      recallReviews: 0,
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

describe("recall review roundtrip", () => {
  it("keeps 1, 3, 7 and 21 day schedules in formatVersion 3", () => {
    const now = Date.parse("2026-09-22T00:00:00.000Z");
    const days = [1, 3, 7, 21];
    const recallReviews = days.map((day, index) => ({
      weekSlug: "how-llms-work",
      itemIndex: index,
      prompt: `вопрос ${index}`,
      nextReviewAt: new Date(now + day * 24 * 60 * 60 * 1000).toISOString(),
      reviewCount: index + 1,
    }));
    const raw = { ...fullFixture, formatVersion: 3 as const, recallReviews };
    const migrated = migrateExport(raw);
    assert.equal(migrated.formatVersion, 3);
    assert.equal(exportSchemaV3.safeParse(raw).success, true);
    assert.deepEqual(
      migrated.recallReviews.map((item) => item.reviewCount),
      [1, 2, 3, 4]
    );
    migrated.recallReviews.forEach((item, index) => {
      const delta = Date.parse(item.nextReviewAt) - now;
      assert.equal(delta, days[index] * 24 * 60 * 60 * 1000);
      assert.equal(item.prompt, recallReviews[index].prompt);
      assert.equal(item.weekSlug, "how-llms-work");
      assert.equal(item.itemIndex, index);
    });
    assert.equal(previewImport(migrated, raw).counts.recallReviews, 4);
  });

  it("accepts v2 and does not invent recall rows", () => {
    const migrated = migrateExport(fullFixture);
    assert.equal(migrated.formatVersion, 3);
    assert.deepEqual(migrated.recallReviews, []);
  });

  it("warns that a v3 file replaces the schedule, including a wipe at count 0", () => {
    const raw = { ...fullFixture, formatVersion: 3 as const, recallReviews: [] as const };
    const preview = previewImport(migrateExport(raw), raw);
    assert.equal(preview.counts.recallReviews, 0);
    const text = preview.warnings.join(" ");
    assert.match(text, /Расписание повторений будет полностью заменено/);
    assert.match(text, /ноль/);
    assert.match(text, /стирается целиком/);
  });

  it("tells a v2 preview that the current schedule stays", () => {
    const preview = previewImport(migrateExport(fullFixture), fullFixture);
    assert.match(preview.warnings.join(" "), /Текущие карточки останутся/);
    assert.equal(importReplacesRecall(fullFixture), false);
  });
});

type RecallCard = { prompt: string };

function createImportDb(initialRecall: RecallCard[], throwOn?: string) {
  let committed = {
    capstone: false,
    recall: initialRecall.map((item) => ({ prompt: item.prompt })),
  };
  const calls: string[] = [];
  return {
    calls,
    get state() {
      return committed;
    },
    async $transaction(fn: (tx: never) => Promise<unknown>) {
      const draft = {
        capstone: committed.capstone,
        recall: committed.recall.map((item) => ({ prompt: item.prompt })),
      };
      const tx = new Proxy(
        {},
        {
          get(_target, prop) {
            const name = String(prop);
            return {
              upsert: async () => {
                calls.push(`${name}.upsert`);
                if (throwOn === name) throw new Error("boom");
                if (name === "capstoneProject") draft.capstone = true;
              },
              deleteMany: async () => {
                calls.push(`${name}.deleteMany`);
                if (throwOn === name) throw new Error("boom");
                if (name === "recallReview") draft.recall = [];
                return { count: draft.recall.length };
              },
              createMany: async () => {
                calls.push(`${name}.createMany`);
                if (throwOn === name) throw new Error("boom");
                return { count: 0 };
              },
            };
          },
        }
      );
      await fn(tx as never);
      committed = draft;
    },
  };
}

describe("importExport bookmark href", () => {
  it("skips javascript: and protocol-relative bookmarks on import", async () => {
    const stored: { targetId: string; href: string }[] = [];
    const db = {
      async $transaction(fn: (tx: never) => Promise<unknown>) {
        const tx = new Proxy(
          {},
          {
            get(_target, prop) {
              const name = String(prop);
              return {
                upsert: async () => ({ count: 0 }),
                deleteMany: async () => ({ count: 0 }),
                createMany: async ({
                  data,
                }: {
                  data: Array<{ targetId: string; href: string }>;
                }) => {
                  if (name === "bookmark") {
                    stored.push(
                      ...data.map((row) => ({
                        targetId: row.targetId,
                        href: row.href,
                      }))
                    );
                  }
                  return { count: data.length };
                },
              };
            },
          }
        );
        await fn(tx as never);
      },
    };

    const payload = {
      ...minimalV1,
      bookmarks: [
        { targetType: "lesson", targetId: "safe", title: "Safe", href: "/week/foundations" },
        { targetType: "lesson", targetId: "js", title: "XSS", href: "javascript:alert(1)" },
        { targetType: "lesson", targetId: "proto", title: "Proto", href: "//evil" },
        {
          targetType: "lesson",
          targetId: "ext",
          title: "Docs",
          href: "https://example.com/docs",
        },
      ],
    };

    const result = await importExport("user-1", payload, db);
    assert.equal(result.ok, true);
    assert.deepEqual(stored, [
      { targetId: "safe", href: "/week/foundations" },
      { targetId: "ext", href: "https://example.com/docs" },
    ]);
  });
});

type LearnerRow = { id: string };

const RESTORE_MODELS = [
  "note",
  "bookmark",
  "lessonProgress",
  "labProgress",
  "exerciseProgress",
  "exerciseAnswer",
  "artifactProgress",
  "weekProgress",
] as const;

type RestoreModel = (typeof RESTORE_MODELS)[number];

function createRestoreImportDb(initial: Partial<Record<RestoreModel, LearnerRow[]>>) {
  const state: Record<RestoreModel, LearnerRow[]> = {
    note: [...(initial.note ?? [])],
    bookmark: [...(initial.bookmark ?? [])],
    lessonProgress: [...(initial.lessonProgress ?? [])],
    labProgress: [...(initial.labProgress ?? [])],
    exerciseProgress: [...(initial.exerciseProgress ?? [])],
    exerciseAnswer: [...(initial.exerciseAnswer ?? [])],
    artifactProgress: [...(initial.artifactProgress ?? [])],
    weekProgress: [...(initial.weekProgress ?? [])],
  };
  const calls: string[] = [];

  const makeModel = (name: RestoreModel) => ({
    deleteMany: async () => {
      calls.push(`${name}.deleteMany`);
      state[name] = [];
      return { count: 0 };
    },
    createMany: async ({ data }: { data: Array<{ id?: string }> }) => {
      calls.push(`${name}.createMany`);
      state[name] = data.map((row, index) => ({ id: row.id ?? `${name}-${index}` }));
      return { count: data.length };
    },
    upsert: async () => {
      calls.push(`${name}.upsert`);
    },
  });

  const db = {
    calls,
    get state() {
      return state;
    },
    async $transaction(fn: (tx: never) => Promise<unknown>) {
      const tx = new Proxy(
        {},
        {
          get(_target, prop) {
            const name = String(prop);
            if (RESTORE_MODELS.includes(name as RestoreModel)) {
              return makeModel(name as RestoreModel);
            }
            if (name === "capstoneProject" || name === "userSettings" || name === "portfolioProject") {
              return { upsert: async () => calls.push(`${name}.upsert`) };
            }
            if (
              name === "quizAttempt" ||
              name === "learningEvent" ||
              name === "recallReview"
            ) {
              return {
                deleteMany: async () => {
                  calls.push(`${name}.deleteMany`);
                  return { count: 0 };
                },
                createMany: async () => {
                  calls.push(`${name}.createMany`);
                  return { count: 0 };
                },
              };
            }
            return undefined;
          },
        }
      );
      await fn(tx as never);
    },
  };

  return db;
}

describe("importExport learner restore", () => {
  it("restores notes, bookmarks, and progress instead of merging stale rows", async () => {
    const db = createRestoreImportDb({
      note: [{ id: "stale-note" }],
      bookmark: [{ id: "stale-bookmark" }],
      lessonProgress: [{ id: "stale-lesson" }],
      labProgress: [{ id: "stale-lab" }],
      exerciseProgress: [{ id: "stale-exercise" }],
      exerciseAnswer: [{ id: "stale-answer" }],
      artifactProgress: [{ id: "stale-artifact" }],
      weekProgress: [{ id: "stale-week" }],
    });

    const payload = {
      ...fullFixture,
      notes: [{ key: "only", body: "from-file", weekSlug: "foundations", lessonId: null, tags: [] }],
      bookmarks: [
        { targetType: "lesson", targetId: "only", title: "Only", href: "/week/foundations" },
      ],
      lessons: [{ lessonId: "only-lesson", weekSlug: "foundations", completed: true }],
      labs: [{ labId: "only-lab", weekSlug: "foundations", completed: false }],
      exercises: [
        {
          exerciseId: "only-exercise",
          weekSlug: "foundations",
          completed: true,
          hintsUsed: 0,
          solutionViewed: false,
        },
      ],
      answers: [
        {
          exerciseId: "only-exercise",
          weekSlug: "foundations",
          body: "answer",
          githubUrl: "",
          resultUrl: "",
        },
      ],
      artifacts: [
        {
          weekSlug: "foundations",
          completed: false,
          githubUrl: "",
          demoUrl: "",
          notes: "",
        },
      ],
      weekProgress: [{ weekSlug: "foundations", percent: 42, completed: false }],
    };

    const result = await importExport("user-1", payload, db);
    assert.equal(result.ok, true);
    assert.equal(db.state.note.length, 1);
    assert.equal(db.state.bookmark.length, 1);
    assert.equal(db.state.lessonProgress.length, 1);
    assert.equal(db.state.labProgress.length, 1);
    assert.equal(db.state.exerciseProgress.length, 1);
    assert.equal(db.state.exerciseAnswer.length, 1);
    assert.equal(db.state.artifactProgress.length, 1);
    assert.equal(db.state.weekProgress.length, 1);
    assert.equal(db.calls.includes("note.deleteMany"), true);
    assert.equal(db.calls.includes("bookmark.deleteMany"), true);
    assert.equal(db.calls.includes("lessonProgress.deleteMany"), true);
    assert.equal(db.calls.includes("weekProgress.deleteMany"), true);
    assert.equal(db.calls.includes("note.upsert"), false);
    assert.equal(db.calls.includes("lessonProgress.upsert"), false);
  });

  it("wipes learner collections when the backup file has none", async () => {
    const db = createRestoreImportDb({
      note: [{ id: "stale-note" }],
      bookmark: [{ id: "stale-bookmark" }],
      weekProgress: [{ id: "stale-week" }],
    });

    const payload = {
      ...fullFixture,
      notes: [],
      bookmarks: [],
      lessons: [],
      labs: [],
      exercises: [],
      answers: [],
      artifacts: [],
      weekProgress: [],
    };

    const result = await importExport("user-1", payload, db);
    assert.equal(result.ok, true);
    assert.deepEqual(db.state.note, []);
    assert.deepEqual(db.state.bookmark, []);
    assert.deepEqual(db.state.weekProgress, []);
    assert.equal(db.calls.includes("note.createMany"), false);
    assert.equal(db.calls.includes("weekProgress.createMany"), false);
  });

  it("warns that notes, bookmarks, and progress are replaced", () => {
    const preview = previewImport(migrateExport(fullFixture), fullFixture);
    assert.match(preview.warnings.join(" "), /Заметки, закладки и прогресс обучения будут полностью заменены/);
  });
});

describe("importExport schedule and rollback", () => {
  it("keeps an existing schedule on a raw formatVersion 2 import", async () => {
    const db = createImportDb([{ prompt: "keep-me" }]);
    const result = await importExport("user-1", fullFixture, db);
    assert.equal(result.ok, true);
    assert.deepEqual(db.state.recall, [{ prompt: "keep-me" }]);
    assert.equal(db.calls.includes("recallReview.deleteMany"), false);
  });

  it("rolls back a failed import and leaves the account unchanged", async () => {
    const db = createImportDb([{ prompt: "keep-me" }], "note");
    const result = await importExport("user-1", fullFixture, db);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /импорт/i);
    assert.equal(db.state.capstone, false);
    assert.deepEqual(db.state.recall, [{ prompt: "keep-me" }]);
    assert.equal(db.calls.includes("capstoneProject.upsert"), true);
  });
});
