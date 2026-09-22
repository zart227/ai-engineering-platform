import { getWeek } from "@course";
import type { Week } from "@course";

type ValidationError = { ok: false; error: string };
type ValidationSuccess = { ok: true; week: Week };

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
