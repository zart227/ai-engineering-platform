import { getWeek } from "@course";
import type { Week } from "@course";

type ValidationError = { ok: false; error: string };
type ValidationSuccess = { ok: true; week: Week };
type CompletionSuccess = { ok: true };

export type ArtifactCompletionFields = {
  notes: string;
  githubUrl: string;
  demoUrl: string;
};

export type PracticeAnswerFields = {
  body: string;
  githubUrl: string;
  resultUrl: string;
};

function weekNotFound(): ValidationError {
  return { ok: false, error: "Неделя не найдена." };
}

export function validateWeekSlug(weekSlug: string): ValidationError | ValidationSuccess {
  const week = getWeek(weekSlug);
  if (!week) return weekNotFound();
  return { ok: true, week };
}

export function validateLessonInWeek(
  weekSlug: string,
  lessonId: string
): ValidationError | (ValidationSuccess & { lessonId: string }) {
  const result = validateWeekSlug(weekSlug);
  if (!result.ok) return result;
  const lesson = result.week.lessons.find((item) => item.id === lessonId);
  if (!lesson) return { ok: false, error: "Урок не найден." };
  return { ok: true, week: result.week, lessonId: lesson.id };
}

export function validateLabInWeek(
  weekSlug: string,
  labId: string
): ValidationError | (ValidationSuccess & { labId: string }) {
  const result = validateWeekSlug(weekSlug);
  if (!result.ok) return result;
  if (result.week.lab.id !== labId) return { ok: false, error: "Лабораторная не найдена." };
  return { ok: true, week: result.week, labId: result.week.lab.id };
}

export function validatePracticeInWeek(
  weekSlug: string,
  exerciseId: string
): ValidationError | (ValidationSuccess & { exerciseId: string }) {
  const result = validateWeekSlug(weekSlug);
  if (!result.ok) return result;
  if (result.week.practice.id !== exerciseId) return { ok: false, error: "Упражнение не найдено." };
  return { ok: true, week: result.week, exerciseId: result.week.practice.id };
}

export function validateLessonCompletion(
  week: Week,
  completed: boolean
): ValidationError | CompletionSuccess {
  if (!completed) return { ok: true };
  if (week.lessons.length === 0) {
    return { ok: false, error: "В этой неделе нет уроков." };
  }
  return { ok: true };
}

export function validateLabCompletion(
  week: Week,
  completed: boolean
): ValidationError | CompletionSuccess {
  if (!completed) return { ok: true };
  if (!week.lab?.id) return { ok: false, error: "Лабораторная не найдена." };
  if (week.lab.steps.length === 0) {
    return { ok: false, error: "Лабораторная не настроена." };
  }
  return { ok: true };
}

export function validatePracticeCompletion(
  week: Week,
  exerciseId: string,
  completed: boolean
): ValidationError | CompletionSuccess {
  if (!completed) return { ok: true };
  if (!week.practice?.id || week.practice.id !== exerciseId) {
    return { ok: false, error: "Упражнение не найдено." };
  }
  if (week.practice.requirements.length === 0) {
    return { ok: false, error: "Упражнение не настроено." };
  }
  return { ok: true };
}

export function validatePracticeAnswerFields(
  completed: boolean,
  answer: PracticeAnswerFields | null
): ValidationError | CompletionSuccess {
  if (!completed) return { ok: true };
  const hasContent = [answer?.body, answer?.githubUrl, answer?.resultUrl].some(
    (value) => Boolean(value?.trim())
  );
  if (!hasContent) {
    return { ok: false, error: "Сначала сохраните черновик практики." };
  }
  return { ok: true };
}

export function validateArtifactCompletion(
  completed: boolean,
  fields: ArtifactCompletionFields,
  options?: { rubricRequired?: boolean; rubricPassed?: boolean }
): ValidationError | CompletionSuccess {
  if (!completed) return { ok: true };
  if (!fields.githubUrl.trim()) {
    return { ok: false, error: "Укажите ссылку на репозиторий." };
  }
  if (options?.rubricRequired && !options.rubricPassed) {
    return {
      ok: false,
      error: "Сначала пройдите самооценку по рубрике артефакта.",
    };
  }
  return { ok: true };
}
