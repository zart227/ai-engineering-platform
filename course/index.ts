import { week1 } from "./week1";
import { week2 } from "./week2";
import { week3 } from "./week3";
import { week4 } from "./week4";
import { week5 } from "./week5";
import { week6 } from "./week6";
import type { Week } from "./types";

export const weeks: Week[] = [week1, week2, week3, week4, week5, week6];

export function getWeek(slug: string) {
  return weeks.find((week) => week.slug === slug);
}

export function weekHref(week: Week) {
  return `/week/${week.slug}`;
}

export const courseMeta = {
  title: "AI Engineering Platform",
  tagline: "Как встроить ИИ в работу: от проблемы до данных",
  length: "6 недель",
  about:
    "Самостоятельный курс по публичной программе AI-курса для продуктовых дизайнеров: фундамент, discovery, ideation, валидация, выкат и аналитика. Теория сразу идёт в один свой проект.",
};
