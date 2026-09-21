import { z } from "zod";
import { prisma } from "@/server/db";

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

export type ExportPayload = z.infer<typeof exportSchema>;

export async function buildExport(userId: string): Promise<ExportPayload> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      capstone: true,
      notes: true,
      exerciseAnswers: true,
      artifactProgress: true,
      lessonProgress: true,
      labProgress: true,
      exerciseProgress: true,
      bookmarks: true,
      settings: true,
    },
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: { email: user.email, name: user.name },
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
    notes: user.notes.map((note) => ({
      key: note.key,
      body: note.body,
      weekSlug: note.weekSlug,
      lessonId: note.lessonId,
      tags: note.tags,
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
    bookmarks: user.bookmarks.map((item) => ({
      targetType: item.targetType,
      targetId: item.targetId,
      title: item.title,
      href: item.href,
    })),
    settings: user.settings
      ? { theme: user.settings.theme, locale: user.settings.locale }
      : undefined,
  };
}

export async function importExport(userId: string, raw: unknown) {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Файл не похож на экспорт ai-engineering-platform." };
  }
  const data = parsed.data;
  await prisma.$transaction(async (tx) => {
    if (data.capstone) {
      await tx.capstoneProject.upsert({
        where: { userId },
        update: data.capstone,
        create: { userId, ...data.capstone },
      });
    }
    for (const note of data.notes) {
      await tx.note.upsert({
        where: { userId_key: { userId, key: note.key } },
        update: {
          body: note.body,
          weekSlug: note.weekSlug ?? null,
          lessonId: note.lessonId ?? null,
          tags: note.tags ?? [],
        },
        create: {
          userId,
          key: note.key,
          body: note.body,
          weekSlug: note.weekSlug ?? null,
          lessonId: note.lessonId ?? null,
          tags: note.tags ?? [],
        },
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
  });
  return { ok: true as const };
}
