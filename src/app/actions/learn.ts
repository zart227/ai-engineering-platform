"use server";

import { getWeek, weeks } from "@course";
import { scoreQuiz } from "@course/completion";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { ExportFormatError, importExport, migrateExport, previewImport } from "@/server/export";
import { recordEvent, safePersistWeek } from "@/server/progress";
import { changePassword } from "@/server/auth";

export async function saveNoteAction(input: {
  key: string;
  body: string;
  weekSlug?: string;
  lessonId?: string;
  tags?: string[];
}) {
  const user = await requireUser();
  try {
    await prisma.note.upsert({
      where: { userId_key: { userId: user.id, key: input.key } },
      update: {
        body: input.body,
        weekSlug: input.weekSlug,
        lessonId: input.lessonId,
        tags: input.tags ?? [],
      },
      create: {
        userId: user.id,
        key: input.key,
        body: input.body,
        weekSlug: input.weekSlug,
        lessonId: input.lessonId,
        tags: input.tags ?? [],
      },
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить заметку." };
  }
}

export async function toggleLessonAction(lessonId: string, weekSlug: string, completed: boolean) {
  const user = await requireUser();
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { completedAt: completed ? new Date() : null, weekSlug },
    create: {
      userId: user.id,
      lessonId,
      weekSlug,
      completedAt: completed ? new Date() : null,
    },
  });
  await recordEvent(user.id, completed ? "lesson_completed" : "lesson_started", {
    weekSlug,
    lessonId,
  });
  if (!existing) {
    await recordEvent(user.id, "lesson_started", { weekSlug, lessonId });
  }
  await safePersistWeek(user.id, weekSlug);
  return { ok: true as const };
}

export async function toggleLabAction(labId: string, weekSlug: string, completed: boolean) {
  const user = await requireUser();
  await prisma.labProgress.upsert({
    where: { userId_labId: { userId: user.id, labId } },
    update: { completedAt: completed ? new Date() : null, weekSlug },
    create: {
      userId: user.id,
      labId,
      weekSlug,
      completedAt: completed ? new Date() : null,
    },
  });
  await recordEvent(user.id, completed ? "lab_completed" : "lab_started", { weekSlug });
  await safePersistWeek(user.id, weekSlug);
  return { ok: true as const };
}

export async function togglePracticeAction(
  exerciseId: string,
  weekSlug: string,
  completed: boolean
) {
  const user = await requireUser();
  await prisma.exerciseProgress.upsert({
    where: { userId_exerciseId: { userId: user.id, exerciseId } },
    update: { completedAt: completed ? new Date() : null, weekSlug },
    create: {
      userId: user.id,
      exerciseId,
      weekSlug,
      completedAt: completed ? new Date() : null,
    },
  });
  await recordEvent(user.id, completed ? "exercise_completed" : "exercise_started", { weekSlug });
  await safePersistWeek(user.id, weekSlug);
  return { ok: true as const };
}

export async function savePracticeAnswerAction(input: {
  exerciseId: string;
  weekSlug: string;
  body: string;
  githubUrl?: string;
  resultUrl?: string;
}) {
  const user = await requireUser();
  try {
    await prisma.exerciseAnswer.upsert({
      where: { userId_exerciseId: { userId: user.id, exerciseId: input.exerciseId } },
      update: {
        body: input.body,
        githubUrl: input.githubUrl ?? "",
        resultUrl: input.resultUrl ?? "",
        weekSlug: input.weekSlug,
      },
      create: {
        userId: user.id,
        exerciseId: input.exerciseId,
        weekSlug: input.weekSlug,
        body: input.body,
        githubUrl: input.githubUrl ?? "",
        resultUrl: input.resultUrl ?? "",
      },
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить ответ." };
  }
}

export async function markHintAction(exerciseId: string, weekSlug: string) {
  const user = await requireUser();
  const current = await prisma.exerciseProgress.findUnique({
    where: { userId_exerciseId: { userId: user.id, exerciseId } },
  });
  await prisma.exerciseProgress.upsert({
    where: { userId_exerciseId: { userId: user.id, exerciseId } },
    update: { hintsUsed: { increment: 1 } },
    create: { userId: user.id, exerciseId, weekSlug, hintsUsed: 1 },
  });
  await recordEvent(user.id, "hint_requested", {
    weekSlug,
    payload: { n: (current?.hintsUsed ?? 0) + 1 },
  });
}

export async function markSolutionAction(exerciseId: string, weekSlug: string) {
  const user = await requireUser();
  await prisma.exerciseProgress.upsert({
    where: { userId_exerciseId: { userId: user.id, exerciseId } },
    update: { solutionViewed: true },
    create: { userId: user.id, exerciseId, weekSlug, solutionViewed: true },
  });
  await recordEvent(user.id, "solution_viewed", { weekSlug });
}

export async function saveArtifactAction(input: {
  weekSlug: string;
  notes: string;
  githubUrl: string;
  demoUrl: string;
  completed: boolean;
}) {
  const user = await requireUser();
  try {
    await prisma.artifactProgress.upsert({
      where: { userId_weekSlug: { userId: user.id, weekSlug: input.weekSlug } },
      update: {
        notes: input.notes,
        githubUrl: input.githubUrl,
        demoUrl: input.demoUrl,
        completed: input.completed,
      },
      create: {
        userId: user.id,
        weekSlug: input.weekSlug,
        notes: input.notes,
        githubUrl: input.githubUrl,
        demoUrl: input.demoUrl,
        completed: input.completed,
      },
    });
    if (input.completed) {
      await recordEvent(user.id, "artifact_completed", { weekSlug: input.weekSlug });
    }
    await safePersistWeek(user.id, input.weekSlug);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить артефакт." };
  }
}

export async function submitQuizAction(weekSlug: string, answers: number[]) {
  const user = await requireUser();
  const week = getWeek(weekSlug);
  if (!week) return { ok: false as const, error: "Неделя не найдена." };
  const correct = week.quiz.questions.map((item) => item.answer);
  const result = scoreQuiz(answers, correct);
  const passed = result.score >= week.quiz.passScore;
  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      weekSlug,
      answers,
      score: result.score,
      passed,
    },
  });
  await recordEvent(user.id, passed ? "quiz_passed" : "quiz_attempted", {
    weekSlug,
    payload: { score: result.score },
  });
  await safePersistWeek(user.id, weekSlug);
  return { ok: true as const, score: result.score, passed };
}

export async function toggleBookmarkAction(input: {
  targetType: string;
  targetId: string;
  title: string;
  href: string;
}) {
  const user = await requireUser();
  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { ok: true as const, on: false };
  }
  await prisma.bookmark.create({
    data: { userId: user.id, ...input },
  });
  return { ok: true as const, on: true };
}

const projectFields = [
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

export async function saveProjectAction(patch: Record<string, string>) {
  const user = await requireUser();
  const data: Record<string, string> = {};
  for (const key of projectFields) {
    if (key in patch) data[key] = patch[key] ?? "";
  }
  try {
    await prisma.capstoneProject.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });
    await recordEvent(user.id, "project_updated");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить проект." };
  }
}

export async function savePortfolioAction(input: {
  id?: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  githubUrl: string;
  demoUrl: string;
  weekSlug?: string;
}) {
  const user = await requireUser();
  const slug = input.slug.trim() || "project";
  const data = {
    slug,
    title: input.title,
    description: input.description,
    status: input.status,
    githubUrl: input.githubUrl,
    demoUrl: input.demoUrl,
    weekSlug: input.weekSlug,
  };
  if (input.id) {
    const updated = await prisma.portfolioProject.updateMany({
      where: { id: input.id, userId: user.id },
      data,
    });
    if (updated.count === 0) {
      return { ok: false as const, error: "Проект не найден." };
    }
  } else {
    await prisma.portfolioProject.create({
      data: { ...data, userId: user.id },
    });
  }
  return { ok: true as const };
}

export async function previewImportAction(raw: unknown) {
  await requireUser();
  try {
    const data = migrateExport(raw);
    const preview = previewImport(data, raw);
    return { ok: true as const, counts: preview.counts, warnings: preview.warnings };
  } catch (error) {
    if (error instanceof ExportFormatError) {
      return { ok: false as const, error: error.message };
    }
    throw error;
  }
}

export async function importLearningAction(raw: unknown) {
  const user = await requireUser();
  const result = await importExport(user.id, raw);
  if (result.ok) {
    for (const week of weeks) {
      await safePersistWeek(user.id, week.slug);
    }
  }
  return result;
}

export async function changePasswordAction(current: string, next: string) {
  const user = await requireUser();
  return changePassword(user.id, current, next);
}

export async function saveSettingsAction(theme: string) {
  const user = await requireUser();
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { theme },
    create: { userId: user.id, theme },
  });
  return { ok: true as const };
}
