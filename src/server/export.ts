import { getWeek } from "@course";
import { scoreQuiz } from "@course/completion";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { sanitizeBookmarkHrefForImport } from "@/server/bookmark-href";
import { prisma } from "@/server/db";

const EXPORT_ERROR = "Файл не похож на экспорт ai-engineering-platform.";

/** Thrown when a parsed JSON value is not a v1–v4 export document. */
export class ExportFormatError extends Error {
  constructor() {
    super(EXPORT_ERROR);
    this.name = "ExportFormatError";
  }
}

const capstoneFields = [
  "name",
  "oneLiner",
  "targetUser",
  "problem",
  "hypothesis",
  "valueProposition",
  "assumptions",
  "competitors",
  "prd",
  "architecture",
  "stack",
  "githubUrl",
  "demoUrl",
  "analytics",
  "notes",
] as const;

type CapstoneField = (typeof capstoneFields)[number];

const capstoneShape = {
  name: z.string().optional(),
  oneLiner: z.string().optional(),
  targetUser: z.string().optional(),
  problem: z.string().optional(),
  hypothesis: z.string().optional(),
  valueProposition: z.string().optional(),
  assumptions: z.string().optional(),
  competitors: z.string().optional(),
  prd: z.string().optional(),
  architecture: z.string().optional(),
  stack: z.string().optional(),
  githubUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  analytics: z.string().optional(),
  notes: z.string().optional(),
} satisfies Record<CapstoneField, z.ZodOptional<z.ZodString>>;

const capstoneSchema = z.object(capstoneShape).strip();

const jsonValue = z.json();

const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)), {
  message: "invalid timestamp",
});

/** Legacy v1 document. `{ version: 2 }` stays invalid for existing callers. */
export const exportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  user: z.object({
    email: z.string().email(),
    name: z.string(),
  }),
  capstone: z.record(z.string(), z.string()).optional(),
  notes: z.array(
    z.object({
      key: z.string(),
      body: z.string(),
      weekSlug: z.string().nullable().optional(),
      lessonId: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
    })
  ),
  answers: z.array(
    z.object({
      exerciseId: z.string(),
      weekSlug: z.string(),
      body: z.string(),
      githubUrl: z.string().optional(),
      resultUrl: z.string().optional(),
    })
  ),
  artifacts: z.array(
    z.object({
      weekSlug: z.string(),
      completed: z.boolean(),
      githubUrl: z.string().optional(),
      demoUrl: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  lessons: z.array(z.object({ lessonId: z.string(), weekSlug: z.string(), completed: z.boolean() })),
  labs: z.array(z.object({ labId: z.string(), weekSlug: z.string(), completed: z.boolean() })),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      weekSlug: z.string(),
      completed: z.boolean(),
      hintsUsed: z.number().optional(),
      solutionViewed: z.boolean().optional(),
    })
  ),
  bookmarks: z.array(
    z.object({
      targetType: z.string(),
      targetId: z.string(),
      title: z.string(),
      href: z.string(),
    })
  ),
  settings: z.object({ theme: z.string().optional(), locale: z.string().optional() }).optional(),
});

export const exportSchemaV2 = z
  .object({
    formatVersion: z.literal(2),
    exportedAt: z.string(),
    user: z
      .object({
        email: z.string().email(),
        name: z.string(),
      })
      .strip(),
    settings: z
      .object({
        theme: z.string(),
        locale: z.string(),
      })
      .strip()
      .nullable(),
    capstone: capstoneSchema,
    portfolio: z.array(
      z
        .object({
          slug: z.string(),
          title: z.string(),
          description: z.string(),
          status: z.string(),
          stack: z.array(z.string()),
          skills: z.array(z.string()),
          githubUrl: z.string(),
          demoUrl: z.string(),
          readme: z.string(),
          weekSlug: z.string().nullable(),
        })
        .strip()
    ),
    notes: z.array(
      z
        .object({
          key: z.string(),
          body: z.string(),
          weekSlug: z.string().nullable().optional(),
          lessonId: z.string().nullable().optional(),
          moduleId: z.string().nullable().optional(),
          tags: z.array(z.string()).optional(),
        })
        .strip()
    ),
    bookmarks: z.array(
      z
        .object({
          targetType: z.string(),
          targetId: z.string(),
          title: z.string(),
          href: z.string(),
        })
        .strip()
    ),
    lessons: z.array(
      z.object({ lessonId: z.string(), weekSlug: z.string(), completed: z.boolean() }).strip()
    ),
    labs: z.array(z.object({ labId: z.string(), weekSlug: z.string(), completed: z.boolean() }).strip()),
    exercises: z.array(
      z
        .object({
          exerciseId: z.string(),
          weekSlug: z.string(),
          completed: z.boolean(),
          hintsUsed: z.number().optional(),
          solutionViewed: z.boolean().optional(),
        })
        .strip()
    ),
    answers: z.array(
      z
        .object({
          exerciseId: z.string(),
          weekSlug: z.string(),
          body: z.string(),
          githubUrl: z.string().optional(),
          resultUrl: z.string().optional(),
        })
        .strip()
    ),
    artifacts: z.array(
      z
        .object({
          weekSlug: z.string(),
          completed: z.boolean(),
          githubUrl: z.string().optional(),
          demoUrl: z.string().optional(),
          notes: z.string().optional(),
        })
        .strip()
    ),
    weekProgress: z.array(
      z
        .object({
          weekSlug: z.string(),
          percent: z.number().int(),
          completed: z.boolean(),
        })
        .strip()
    ),
    quizAttempts: z.array(
      z
        .object({
          weekSlug: z.string(),
          answers: jsonValue,
          score: z.number().int(),
          passed: z.boolean(),
          createdAt: timestamp,
        })
        .strip()
    ),
    learningEvents: z.array(
      z
        .object({
          type: z.string(),
          weekSlug: z.string().nullable(),
          lessonId: z.string().nullable(),
          payload: jsonValue,
          createdAt: timestamp,
        })
        .strip()
    ),
  })
  .strip();

const recallReviewSchema = z
  .object({
    weekSlug: z.string(),
    itemIndex: z.number().int().nonnegative(),
    prompt: z.string(),
    nextReviewAt: timestamp,
    reviewCount: z.number().int().nonnegative(),
  })
  .strip();

export const exportSchemaV3 = exportSchemaV2
  .omit({ formatVersion: true })
  .extend({
    formatVersion: z.literal(3),
    recallReviews: z.array(recallReviewSchema),
  })
  .strip();

const rubricCriterionResultSchema = z
  .object({
    criterionId: z.string(),
    met: z.boolean(),
    evidence: z.string(),
    weight: z.number().int().positive(),
  })
  .strip();

const artifactAssessmentSchema = z
  .object({
    weekSlug: z.string(),
    source: z.enum(["self_check", "policy_approved"]),
    score: z.number().int().nonnegative(),
    passed: z.boolean(),
    assessedAt: timestamp.nullable(),
    criteria: z.array(rubricCriterionResultSchema),
  })
  .strip();

export const exportSchemaV4 = exportSchemaV3
  .omit({ formatVersion: true })
  .extend({
    formatVersion: z.literal(4),
    artifactAssessments: z.array(artifactAssessmentSchema),
  })
  .strip();

export type ExportPayloadV1 = z.infer<typeof exportSchema>;
export type ExportPayloadV2 = z.infer<typeof exportSchemaV2>;
export type ExportPayloadV3 = z.infer<typeof exportSchemaV3>;
export type ExportPayloadV4 = z.infer<typeof exportSchemaV4>;
export type ExportPayload = ExportPayloadV4;

export type ImportCounts = {
  capstone: number;
  settings: number;
  portfolio: number;
  notes: number;
  bookmarks: number;
  lessons: number;
  labs: number;
  exercises: number;
  answers: number;
  artifacts: number;
  weekProgress: number;
  quizAttempts: number;
  learningEvents: number;
  recallReviews: number;
  artifactAssessments: number;
};

const SECRET_KEYS = new Set(["passwordHash", "tokenHash", "session", "token", "ip", "userAgent"]);

const V1_ROOT = new Set([
  "version",
  "exportedAt",
  "user",
  "capstone",
  "notes",
  "answers",
  "artifacts",
  "lessons",
  "labs",
  "exercises",
  "bookmarks",
  "settings",
]);

const V2_ROOT = new Set([
  "formatVersion",
  "exportedAt",
  "user",
  "settings",
  "capstone",
  "portfolio",
  "notes",
  "bookmarks",
  "lessons",
  "labs",
  "exercises",
  "answers",
  "artifacts",
  "weekProgress",
  "quizAttempts",
  "learningEvents",
]);

const V3_ROOT = new Set([...V2_ROOT, "recallReviews"]);
const V4_ROOT = new Set([...V3_ROOT, "artifactAssessments"]);

const USER_KEYS = new Set(["email", "name"]);
const SETTINGS_KEYS = new Set(["theme", "locale"]);
const CAPSTONE_KEYS = new Set<string>(capstoneFields);

const REPLACE_WARNING =
  "Попытки квизов и события обучения будут заменены данными из файла. Если в файле их нет, текущие записи этого типа удалятся.";

const KEEP_HISTORY_WARNING =
  "Файл версии 1 не содержит попытки квизов и события обучения. Они останутся как есть.";

const REPLACE_RECALL_WARNING =
  "Расписание повторений будет полностью заменено файлом версии 3+. Карточки, которых нет в файле, удалятся. Если повторений в файле ноль, текущее расписание стирается целиком.";

const KEEP_RECALL_WARNING =
  "Файл версии 1 или 2 не заменяет расписание повторений. Текущие карточки останутся.";

const REPLACE_ASSESSMENT_WARNING =
  "Самооценки рубрики артефакта будут полностью заменены файлом версии 4. Если оценок в файле ноль, текущие записи стираются.";

const KEEP_ASSESSMENT_WARNING =
  "Файл версии 1–3 не заменяет самооценки рубрики. Текущие оценки останутся.";

const REPLACE_LEARNER_STATE_WARNING =
  "Заметки, закладки, прогресс обучения, капстоун и проекты портфолио будут полностью заменены данными из файла. Записи, которых нет в файле, удалятся.";

/** v1 files never stored quiz attempts or learning events, so importing one must not delete them. */
export function importReplacesHistory(raw: unknown): boolean {
  return isRecord(raw) && (raw.formatVersion === 2 || raw.formatVersion === 3 || raw.formatVersion === 4);
}

/** Only v3+ carries RecallReview. v1 and v2 must not wipe the schedule. */
export function importReplacesRecall(raw: unknown): boolean {
  return isRecord(raw) && (raw.formatVersion === 3 || raw.formatVersion === 4);
}

/** Only v4 carries ArtifactAssessment. Older exports must not wipe assessments. */
export function importReplacesAssessments(raw: unknown): boolean {
  return isRecord(raw) && raw.formatVersion === 4;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickCapstone(input: unknown): Partial<Record<CapstoneField, string>> {
  const data: Partial<Record<CapstoneField, string>> = {};
  if (!isRecord(input)) return data;
  for (const key of capstoneFields) {
    const value = input[key];
    if (typeof value === "string") data[key] = value;
  }
  return data;
}

function v1ToV2(data: ExportPayloadV1): ExportPayloadV2 {
  return exportSchemaV2.parse({
    formatVersion: 2,
    exportedAt: data.exportedAt,
    user: { email: data.user.email, name: data.user.name },
    settings: data.settings
      ? {
          theme: data.settings.theme ?? "system",
          locale: data.settings.locale ?? "ru",
        }
      : null,
    capstone: data.capstone ?? {},
    portfolio: [],
    notes: data.notes.map((note) => ({
      key: note.key,
      body: note.body,
      weekSlug: note.weekSlug ?? null,
      lessonId: note.lessonId ?? null,
      moduleId: null,
      tags: note.tags ?? [],
    })),
    bookmarks: data.bookmarks,
    lessons: data.lessons,
    labs: data.labs,
    exercises: data.exercises,
    answers: data.answers,
    artifacts: data.artifacts,
    weekProgress: [],
    quizAttempts: [],
    learningEvents: [],
  });
}

function v2ToV3(data: ExportPayloadV2): ExportPayloadV3 {
  return exportSchemaV3.parse({ ...data, formatVersion: 3, recallReviews: [] });
}

function v3ToV4(data: ExportPayloadV3): ExportPayloadV4 {
  return exportSchemaV4.parse({ ...data, formatVersion: 4, artifactAssessments: [] });
}

export function migrateExport(raw: unknown): ExportPayloadV4 {
  if (!isRecord(raw)) throw new ExportFormatError();
  if (raw.formatVersion === 4) {
    const parsed = exportSchemaV4.safeParse(raw);
    if (!parsed.success) throw new ExportFormatError();
    return parsed.data;
  }
  if (raw.formatVersion === 3) {
    const parsed = exportSchemaV3.safeParse(raw);
    if (!parsed.success) throw new ExportFormatError();
    return v3ToV4(parsed.data);
  }
  if (raw.formatVersion === 2) {
    const parsed = exportSchemaV2.safeParse(raw);
    if (!parsed.success) throw new ExportFormatError();
    return v3ToV4(v2ToV3(parsed.data));
  }
  if (raw.version === 1 && !("formatVersion" in raw)) {
    const parsed = exportSchema.safeParse(raw);
    if (!parsed.success) throw new ExportFormatError();
    return v3ToV4(v2ToV3(v1ToV2(parsed.data)));
  }
  throw new ExportFormatError();
}

export function parseExport(
  raw: unknown
): { ok: true; data: ExportPayloadV4; warnings: string[] } | { ok: false; error: string } {
  try {
    const data = migrateExport(raw);
    return { ok: true, data, warnings: previewImport(data, raw).warnings };
  } catch (error) {
    if (error instanceof ExportFormatError) return { ok: false, error: error.message };
    throw error;
  }
}

function noteStrippedKeys(value: unknown, allowed: Set<string>, flags: { secrets: boolean; unknown: boolean }) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (allowed.has(key)) continue;
    if (SECRET_KEYS.has(key)) flags.secrets = true;
    else flags.unknown = true;
  }
}

function collectStripWarnings(raw: unknown): string[] {
  if (!isRecord(raw)) return [];
  const flags = { secrets: false, unknown: false };
  const root =
    raw.formatVersion === 4
      ? V4_ROOT
      : raw.formatVersion === 3
        ? V3_ROOT
        : raw.formatVersion === 2
          ? V2_ROOT
          : V1_ROOT;
  noteStrippedKeys(raw, root, flags);
  noteStrippedKeys(raw.user, USER_KEYS, flags);
  noteStrippedKeys(raw.settings, SETTINGS_KEYS, flags);
  noteStrippedKeys(raw.capstone, CAPSTONE_KEYS, flags);
  const warnings: string[] = [];
  if (flags.secrets) warnings.push("Секреты из файла проигнорированы и не будут сохранены.");
  if (flags.unknown) warnings.push("Неизвестные поля отброшены.");
  return warnings;
}

function countCapstone(capstone: ExportPayloadV2["capstone"]): number {
  return Object.values(capstone).some((value) => typeof value === "string") ? 1 : 0;
}

export function previewImport(
  data: ExportPayloadV4,
  raw?: unknown
): { counts: ImportCounts; warnings: string[] } {
  return {
    counts: {
      capstone: countCapstone(data.capstone),
      settings: data.settings ? 1 : 0,
      portfolio: data.portfolio.length,
      notes: data.notes.length,
      bookmarks: data.bookmarks.length,
      lessons: data.lessons.length,
      labs: data.labs.length,
      exercises: data.exercises.length,
      answers: data.answers.length,
      artifacts: data.artifacts.length,
      weekProgress: data.weekProgress.length,
      quizAttempts: data.quizAttempts.length,
      learningEvents: data.learningEvents.length,
      recallReviews: data.recallReviews.length,
      artifactAssessments: data.artifactAssessments.length,
    },
    warnings: [
      REPLACE_LEARNER_STATE_WARNING,
      importReplacesHistory(raw) ? REPLACE_WARNING : KEEP_HISTORY_WARNING,
      importReplacesRecall(raw) ? REPLACE_RECALL_WARNING : KEEP_RECALL_WARNING,
      importReplacesAssessments(raw) ? REPLACE_ASSESSMENT_WARNING : KEEP_ASSESSMENT_WARNING,
      ...collectStripWarnings(raw),
    ],
  };
}

function jsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function parseQuizAnswerIndices(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every((item) => typeof item === "number" && Number.isInteger(item))) return null;
  return value;
}

/** Re-score imported quiz rows when answer indices are present; reject unverified passed flags. */
export function resolveImportedQuizAttempt(input: {
  weekSlug: string;
  answers: unknown;
  score: number;
  passed: boolean;
}): { answers: Prisma.InputJsonValue | typeof Prisma.JsonNull; score: number; passed: boolean } {
  const week = getWeek(input.weekSlug);
  const answerIndices = parseQuizAnswerIndices(input.answers);
  if (week && answerIndices) {
    const correct = week.quiz.questions.map((question) => question.answer);
    const scored = scoreQuiz(answerIndices, correct, week.quiz.passScore);
    return {
      answers: answerIndices,
      score: scored.score,
      passed: scored.passed,
    };
  }
  return {
    answers: jsonInput(input.answers),
    score: input.score,
    passed: input.passed ? false : input.passed,
  };
}

async function persistImport(
  tx: Prisma.TransactionClient,
  userId: string,
  data: ExportPayloadV4,
  replaceHistory: boolean,
  replaceRecall: boolean,
  replaceAssessments: boolean
) {
  const capstone = pickCapstone(data.capstone);
  await tx.capstoneProject.deleteMany({ where: { userId } });
  await tx.capstoneProject.create({
    data: { userId, ...capstone },
  });
  if (data.settings) {
    await tx.userSettings.upsert({
      where: { userId },
      update: { theme: data.settings.theme, locale: data.settings.locale },
      create: { userId, theme: data.settings.theme, locale: data.settings.locale },
    });
  }
  await tx.note.deleteMany({ where: { userId } });
  if (data.notes.length > 0) {
    await tx.note.createMany({
      data: data.notes.map((note) => ({
        userId,
        key: note.key,
        body: note.body,
        weekSlug: note.weekSlug ?? null,
        lessonId: note.lessonId ?? null,
        moduleId: note.moduleId ?? null,
        tags: note.tags ?? [],
      })),
    });
  }
  await tx.bookmark.deleteMany({ where: { userId } });
  const bookmarkRows = data.bookmarks.flatMap((bookmark) => {
    const href = sanitizeBookmarkHrefForImport(bookmark.href);
    if (!href) return [];
    return [
      {
        userId,
        targetType: bookmark.targetType,
        targetId: bookmark.targetId,
        title: bookmark.title,
        href,
      },
    ];
  });
  if (bookmarkRows.length > 0) {
    await tx.bookmark.createMany({ data: bookmarkRows });
  }
  await tx.portfolioProject.deleteMany({ where: { userId } });
  if (data.portfolio.length > 0) {
    await tx.portfolioProject.createMany({
      data: data.portfolio.map((item) => ({
        userId,
        slug: item.slug,
        title: item.title,
        description: item.description,
        status: item.status,
        stack: item.stack,
        skills: item.skills,
        githubUrl: item.githubUrl,
        demoUrl: item.demoUrl,
        readme: item.readme,
        weekSlug: item.weekSlug,
      })),
    });
  }
  await tx.lessonProgress.deleteMany({ where: { userId } });
  if (data.lessons.length > 0) {
    await tx.lessonProgress.createMany({
      data: data.lessons.map((lesson) => ({
        userId,
        lessonId: lesson.lessonId,
        weekSlug: lesson.weekSlug,
        completedAt: lesson.completed ? new Date() : null,
      })),
    });
  }
  await tx.labProgress.deleteMany({ where: { userId } });
  if (data.labs.length > 0) {
    await tx.labProgress.createMany({
      data: data.labs.map((lab) => ({
        userId,
        labId: lab.labId,
        weekSlug: lab.weekSlug,
        completedAt: lab.completed ? new Date() : null,
      })),
    });
  }
  await tx.exerciseProgress.deleteMany({ where: { userId } });
  if (data.exercises.length > 0) {
    await tx.exerciseProgress.createMany({
      data: data.exercises.map((exercise) => ({
        userId,
        exerciseId: exercise.exerciseId,
        weekSlug: exercise.weekSlug,
        completedAt: exercise.completed ? new Date() : null,
        hintsUsed: exercise.hintsUsed ?? 0,
        solutionViewed: exercise.solutionViewed ?? false,
      })),
    });
  }
  await tx.exerciseAnswer.deleteMany({ where: { userId } });
  if (data.answers.length > 0) {
    await tx.exerciseAnswer.createMany({
      data: data.answers.map((answer) => ({
        userId,
        exerciseId: answer.exerciseId,
        weekSlug: answer.weekSlug,
        body: answer.body,
        githubUrl: answer.githubUrl ?? "",
        resultUrl: answer.resultUrl ?? "",
      })),
    });
  }
  await tx.artifactProgress.deleteMany({ where: { userId } });
  if (data.artifacts.length > 0) {
    await tx.artifactProgress.createMany({
      data: data.artifacts.map((artifact) => ({
        userId,
        weekSlug: artifact.weekSlug,
        completed: artifact.completed,
        githubUrl: artifact.githubUrl ?? "",
        demoUrl: artifact.demoUrl ?? "",
        notes: artifact.notes ?? "",
      })),
    });
  }
  await tx.weekProgress.deleteMany({ where: { userId } });
  if (data.weekProgress.length > 0) {
    await tx.weekProgress.createMany({
      data: data.weekProgress.map((week) => ({
        userId,
        weekSlug: week.weekSlug,
        percent: week.percent,
        completedAt: week.completed ? new Date() : null,
      })),
    });
  }
  if (replaceHistory) {
    await tx.quizAttempt.deleteMany({ where: { userId } });
    if (data.quizAttempts.length > 0) {
      await tx.quizAttempt.createMany({
        data: data.quizAttempts.map((item) => {
          const resolved = resolveImportedQuizAttempt({
            weekSlug: item.weekSlug,
            answers: item.answers,
            score: item.score,
            passed: item.passed,
          });
          return {
            userId,
            weekSlug: item.weekSlug,
            answers: resolved.answers,
            score: resolved.score,
            passed: resolved.passed,
            createdAt: new Date(item.createdAt),
          };
        }),
      });
    }
    await tx.learningEvent.deleteMany({ where: { userId } });
    if (data.learningEvents.length > 0) {
      await tx.learningEvent.createMany({
        data: data.learningEvents.map((item) => ({
          userId,
          type: item.type,
          weekSlug: item.weekSlug,
          lessonId: item.lessonId,
          payload: jsonInput(item.payload),
          createdAt: new Date(item.createdAt),
        })),
      });
    }
  }
  if (replaceRecall) {
    await tx.recallReview.deleteMany({ where: { userId } });
    if (data.recallReviews.length > 0) {
      await tx.recallReview.createMany({
        data: data.recallReviews.map((item) => ({
          userId,
          weekSlug: item.weekSlug,
          itemIndex: item.itemIndex,
          prompt: item.prompt,
          nextReviewAt: new Date(item.nextReviewAt),
          reviewCount: item.reviewCount,
        })),
      });
    }
  }
  if (replaceAssessments) {
    await tx.artifactAssessment.deleteMany({ where: { userId } });
    for (const item of data.artifactAssessments) {
      await tx.artifactAssessment.create({
        data: {
          userId,
          weekSlug: item.weekSlug,
          source: item.source,
          score: item.score,
          passed: item.passed,
          assessedAt: item.assessedAt ? new Date(item.assessedAt) : null,
          criteria: {
            create: item.criteria.map((criterion) => ({
              criterionId: criterion.criterionId,
              met: criterion.met,
              evidence: criterion.evidence,
              weight: criterion.weight,
            })),
          },
        },
      });
    }
  }
}

export async function buildExport(userId: string): Promise<ExportPayload> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      capstone: true,
      settings: true,
      portfolioProjects: true,
      notes: true,
      bookmarks: true,
      lessonProgress: true,
      labProgress: true,
      exerciseProgress: true,
      exerciseAnswers: true,
      artifactProgress: true,
      artifactAssessments: {
        include: { criteria: { orderBy: { criterionId: "asc" } } },
        orderBy: { weekSlug: "asc" },
      },
      weekProgress: true,
      quizAttempts: { orderBy: { createdAt: "asc" } },
      learningEvents: { orderBy: { createdAt: "asc" } },
      recallReviews: { orderBy: [{ weekSlug: "asc" }, { itemIndex: "asc" }] },
    },
  });

  return exportSchemaV4.parse({
    formatVersion: 4,
    exportedAt: new Date().toISOString(),
    user: { email: user.email, name: user.name },
    settings: user.settings ? { theme: user.settings.theme, locale: user.settings.locale } : null,
    capstone: user.capstone
      ? {
          name: user.capstone.name,
          oneLiner: user.capstone.oneLiner,
          targetUser: user.capstone.targetUser,
          problem: user.capstone.problem,
          hypothesis: user.capstone.hypothesis,
          valueProposition: user.capstone.valueProposition,
          assumptions: user.capstone.assumptions,
          competitors: user.capstone.competitors,
          prd: user.capstone.prd,
          architecture: user.capstone.architecture,
          stack: user.capstone.stack,
          githubUrl: user.capstone.githubUrl,
          demoUrl: user.capstone.demoUrl,
          analytics: user.capstone.analytics,
          notes: user.capstone.notes,
        }
      : {},
    portfolio: user.portfolioProjects.map((item) => ({
      slug: item.slug,
      title: item.title,
      description: item.description,
      status: item.status,
      stack: item.stack,
      skills: item.skills,
      githubUrl: item.githubUrl,
      demoUrl: item.demoUrl,
      readme: item.readme,
      weekSlug: item.weekSlug,
    })),
    notes: user.notes.map((note) => ({
      key: note.key,
      body: note.body,
      weekSlug: note.weekSlug,
      lessonId: note.lessonId,
      moduleId: note.moduleId,
      tags: note.tags,
    })),
    bookmarks: user.bookmarks.map((item) => ({
      targetType: item.targetType,
      targetId: item.targetId,
      title: item.title,
      href: item.href,
    })),
    lessons: user.lessonProgress.map((item) => ({
      lessonId: item.lessonId,
      weekSlug: item.weekSlug,
      completed: Boolean(item.completedAt),
    })),
    labs: user.labProgress.map((item) => ({
      labId: item.labId,
      weekSlug: item.weekSlug,
      completed: Boolean(item.completedAt),
    })),
    exercises: user.exerciseProgress.map((item) => ({
      exerciseId: item.exerciseId,
      weekSlug: item.weekSlug,
      completed: Boolean(item.completedAt),
      hintsUsed: item.hintsUsed,
      solutionViewed: item.solutionViewed,
    })),
    answers: user.exerciseAnswers.map((item) => ({
      exerciseId: item.exerciseId,
      weekSlug: item.weekSlug,
      body: item.body,
      githubUrl: item.githubUrl,
      resultUrl: item.resultUrl,
    })),
    artifacts: user.artifactProgress.map((item) => ({
      weekSlug: item.weekSlug,
      completed: item.completed,
      githubUrl: item.githubUrl,
      demoUrl: item.demoUrl,
      notes: item.notes,
    })),
    weekProgress: user.weekProgress.map((item) => ({
      weekSlug: item.weekSlug,
      percent: item.percent,
      completed: Boolean(item.completedAt),
    })),
    quizAttempts: user.quizAttempts.map((item) => ({
      weekSlug: item.weekSlug,
      answers: item.answers,
      score: item.score,
      passed: item.passed,
      createdAt: item.createdAt.toISOString(),
    })),
    learningEvents: user.learningEvents.map((item) => ({
      type: item.type,
      weekSlug: item.weekSlug,
      lessonId: item.lessonId,
      payload: item.payload ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
    recallReviews: user.recallReviews.map((item) => ({
      weekSlug: item.weekSlug,
      itemIndex: item.itemIndex,
      prompt: item.prompt,
      nextReviewAt: item.nextReviewAt.toISOString(),
      reviewCount: item.reviewCount,
    })),
    artifactAssessments: user.artifactAssessments.map((item) => ({
      weekSlug: item.weekSlug,
      source: item.source === "policy_approved" ? "policy_approved" : "self_check",
      score: item.score,
      passed: item.passed,
      assessedAt: item.assessedAt ? item.assessedAt.toISOString() : null,
      criteria: item.criteria.map((criterion) => ({
        criterionId: criterion.criterionId,
        met: criterion.met,
        evidence: criterion.evidence,
        weight: criterion.weight,
      })),
    })),
  });
}

type ImportDb = {
  $transaction(fn: (tx: Prisma.TransactionClient) => Promise<unknown>): Promise<unknown>;
};

export async function importExport(userId: string, raw: unknown, db: ImportDb = prisma) {
  const parsed = parseExport(raw);
  if (!parsed.ok) return { ok: false as const, error: parsed.error };
  const imported = previewImport(parsed.data, raw).counts;
  try {
    await db.$transaction(async (tx) => {
      await persistImport(
        tx,
        userId,
        parsed.data,
        importReplacesHistory(raw),
        importReplacesRecall(raw),
        importReplacesAssessments(raw)
      );
    });
  } catch {
    return { ok: false as const, error: "Не удалось импортировать данные." };
  }
  return { ok: true as const, imported };
}
