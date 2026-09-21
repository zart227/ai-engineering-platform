import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";

const EXPORT_ERROR = "Файл не похож на экспорт ai-engineering-platform.";

/** Thrown when a parsed JSON value is not a v1 or v2 export document. */
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

export type ExportPayloadV1 = z.infer<typeof exportSchema>;
export type ExportPayloadV2 = z.infer<typeof exportSchemaV2>;
export type ExportPayload = ExportPayloadV2;

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

const USER_KEYS = new Set(["email", "name"]);
const SETTINGS_KEYS = new Set(["theme", "locale"]);
const CAPSTONE_KEYS = new Set<string>(capstoneFields);

const REPLACE_WARNING =
  "Попытки квизов и события обучения будут заменены данными из файла. Если в файле их нет, текущие записи этого типа удалятся.";

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

export function migrateExport(raw: unknown): ExportPayloadV2 {
  if (!isRecord(raw)) throw new ExportFormatError();
  if ("formatVersion" in raw) {
    if (raw.formatVersion !== 2) throw new ExportFormatError();
    const parsed = exportSchemaV2.safeParse(raw);
    if (!parsed.success) throw new ExportFormatError();
    return parsed.data;
  }
  if (raw.version === 1) {
    const parsed = exportSchema.safeParse(raw);
    if (!parsed.success) throw new ExportFormatError();
    return v1ToV2(parsed.data);
  }
  throw new ExportFormatError();
}

export function parseExport(
  raw: unknown
): { ok: true; data: ExportPayloadV2; warnings: string[] } | { ok: false; error: string } {
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
  noteStrippedKeys(raw, raw.formatVersion === 2 ? V2_ROOT : V1_ROOT, flags);
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
  data: ExportPayloadV2,
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
    },
    warnings: [REPLACE_WARNING, ...collectStripWarnings(raw)],
  };
}

function jsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

async function persistImport(tx: Prisma.TransactionClient, userId: string, data: ExportPayloadV2) {
  const capstone = pickCapstone(data.capstone);
  if (Object.keys(capstone).length > 0) {
    await tx.capstoneProject.upsert({
      where: { userId },
      update: capstone,
      create: { userId, ...capstone },
    });
  }
  if (data.settings) {
    await tx.userSettings.upsert({
      where: { userId },
      update: { theme: data.settings.theme, locale: data.settings.locale },
      create: { userId, theme: data.settings.theme, locale: data.settings.locale },
    });
  }
  for (const note of data.notes) {
    await tx.note.upsert({
      where: { userId_key: { userId, key: note.key } },
      update: {
        body: note.body,
        weekSlug: note.weekSlug ?? null,
        lessonId: note.lessonId ?? null,
        moduleId: note.moduleId ?? null,
        tags: note.tags ?? [],
      },
      create: {
        userId,
        key: note.key,
        body: note.body,
        weekSlug: note.weekSlug ?? null,
        lessonId: note.lessonId ?? null,
        moduleId: note.moduleId ?? null,
        tags: note.tags ?? [],
      },
    });
  }
  for (const bookmark of data.bookmarks) {
    await tx.bookmark.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: bookmark.targetType,
          targetId: bookmark.targetId,
        },
      },
      update: { title: bookmark.title, href: bookmark.href },
      create: {
        userId,
        targetType: bookmark.targetType,
        targetId: bookmark.targetId,
        title: bookmark.title,
        href: bookmark.href,
      },
    });
  }
  for (const item of data.portfolio) {
    const fields = {
      title: item.title,
      description: item.description,
      status: item.status,
      stack: item.stack,
      skills: item.skills,
      githubUrl: item.githubUrl,
      demoUrl: item.demoUrl,
      readme: item.readme,
      weekSlug: item.weekSlug,
    };
    await tx.portfolioProject.upsert({
      where: { userId_slug: { userId, slug: item.slug } },
      update: fields,
      create: { userId, slug: item.slug, ...fields },
    });
  }
  for (const lesson of data.lessons) {
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.lessonId } },
      update: { completedAt: lesson.completed ? new Date() : null, weekSlug: lesson.weekSlug },
      create: {
        userId,
        lessonId: lesson.lessonId,
        weekSlug: lesson.weekSlug,
        completedAt: lesson.completed ? new Date() : null,
      },
    });
  }
  for (const lab of data.labs) {
    await tx.labProgress.upsert({
      where: { userId_labId: { userId, labId: lab.labId } },
      update: { completedAt: lab.completed ? new Date() : null, weekSlug: lab.weekSlug },
      create: {
        userId,
        labId: lab.labId,
        weekSlug: lab.weekSlug,
        completedAt: lab.completed ? new Date() : null,
      },
    });
  }
  for (const exercise of data.exercises) {
    await tx.exerciseProgress.upsert({
      where: { userId_exerciseId: { userId, exerciseId: exercise.exerciseId } },
      update: {
        completedAt: exercise.completed ? new Date() : null,
        weekSlug: exercise.weekSlug,
        hintsUsed: exercise.hintsUsed ?? 0,
        solutionViewed: exercise.solutionViewed ?? false,
      },
      create: {
        userId,
        exerciseId: exercise.exerciseId,
        weekSlug: exercise.weekSlug,
        completedAt: exercise.completed ? new Date() : null,
        hintsUsed: exercise.hintsUsed ?? 0,
        solutionViewed: exercise.solutionViewed ?? false,
      },
    });
  }
  for (const answer of data.answers) {
    await tx.exerciseAnswer.upsert({
      where: { userId_exerciseId: { userId, exerciseId: answer.exerciseId } },
      update: {
        body: answer.body,
        weekSlug: answer.weekSlug,
        githubUrl: answer.githubUrl ?? "",
        resultUrl: answer.resultUrl ?? "",
      },
      create: {
        userId,
        exerciseId: answer.exerciseId,
        weekSlug: answer.weekSlug,
        body: answer.body,
        githubUrl: answer.githubUrl ?? "",
        resultUrl: answer.resultUrl ?? "",
      },
    });
  }
  for (const artifact of data.artifacts) {
    await tx.artifactProgress.upsert({
      where: { userId_weekSlug: { userId, weekSlug: artifact.weekSlug } },
      update: {
        completed: artifact.completed,
        githubUrl: artifact.githubUrl ?? "",
        demoUrl: artifact.demoUrl ?? "",
        notes: artifact.notes ?? "",
      },
      create: {
        userId,
        weekSlug: artifact.weekSlug,
        completed: artifact.completed,
        githubUrl: artifact.githubUrl ?? "",
        demoUrl: artifact.demoUrl ?? "",
        notes: artifact.notes ?? "",
      },
    });
  }
  for (const week of data.weekProgress) {
    await tx.weekProgress.upsert({
      where: { userId_weekSlug: { userId, weekSlug: week.weekSlug } },
      update: { percent: week.percent, completedAt: week.completed ? new Date() : null },
      create: {
        userId,
        weekSlug: week.weekSlug,
        percent: week.percent,
        completedAt: week.completed ? new Date() : null,
      },
    });
  }
  await tx.quizAttempt.deleteMany({ where: { userId } });
  if (data.quizAttempts.length > 0) {
    await tx.quizAttempt.createMany({
      data: data.quizAttempts.map((item) => ({
        userId,
        weekSlug: item.weekSlug,
        answers: jsonInput(item.answers),
        score: item.score,
        passed: item.passed,
        createdAt: new Date(item.createdAt),
      })),
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
      weekProgress: true,
      quizAttempts: { orderBy: { createdAt: "asc" } },
      learningEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  return exportSchemaV2.parse({
    formatVersion: 2,
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
  });
}

export async function importExport(userId: string, raw: unknown) {
  const parsed = parseExport(raw);
  if (!parsed.ok) return { ok: false as const, error: parsed.error };
  const imported = previewImport(parsed.data).counts;
  try {
    await prisma.$transaction(async (tx) => {
      await persistImport(tx, userId, parsed.data);
    });
  } catch {
    return { ok: false as const, error: "Не удалось импортировать данные." };
  }
  return { ok: true as const, imported };
}
