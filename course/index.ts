import { modules, moduleByWeekSlug } from "./curriculum";
import { courseMeta } from "./types";
import type { Week } from "./types";
import { week01 } from "./weeks/week-01";
import { week02 } from "./weeks/week-02";
import { week03 } from "./weeks/week-03";
import { week04 } from "./weeks/week-04";
import { weeks05to08 } from "./weeks/weeks-05-08";
import { weeks09to10 } from "./weeks/weeks-09-10";
import { weeks11to12 } from "./weeks/weeks-11-12";
import { weeks13to16 } from "./weeks/weeks-13-16";
import { weeks17to19 } from "./weeks/weeks-17-19";
import { weeks20to24 } from "./weeks/weeks-20-24";
import { weeks25to27 } from "./weeks/weeks-25-27";
import { weeks28to33 } from "./weeks/weeks-28-32";

export { courseMeta } from "./types";
export { modules, getModule, moduleByWeekSlug } from "./curriculum";
export type {
  Week,
  Lesson,
  Lab,
  Exercise,
  PromptTemplate,
  Quiz,
  ArtifactSpec,
  DecisionCard,
  ContentBlock,
  CourseModule,
  GlossaryTerm,
} from "./types";

export const weeks: Week[] = [
  week01,
  week02,
  week03,
  week04,
  ...weeks05to08,
  ...weeks09to10,
  ...weeks11to12,
  ...weeks13to16,
  ...weeks17to19,
  ...weeks20to24,
  ...weeks25to27,
  ...weeks28to33,
].sort((a, b) => a.id - b.id);

export function getWeek(slug: string) {
  return weeks.find((week) => week.slug === slug);
}

export function weekHref(week: Week) {
  return `/week/${week.slug}`;
}

export function adjacentWeeks(slug: string) {
  const index = weeks.findIndex((week) => week.slug === slug);
  return {
    prev: index > 0 ? weeks[index - 1] : null,
    next: index >= 0 && index < weeks.length - 1 ? weeks[index + 1] : null,
    index,
  };
}

export function weekModule(week: Week) {
  return moduleByWeekSlug(week.slug) ?? modules[0];
}

export { courseMeta as meta };
