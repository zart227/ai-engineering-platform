import { modules, moduleByWeekSlug } from "./curriculum";
import { courseMeta } from "./types";
import type { Week } from "./types";
import { week01 } from "./weeks/week-01";
import { week02 } from "./weeks/week-02";
import { week03 } from "./weeks/week-03";
import { week04 } from "./weeks/week-04";
import { week05 } from "./weeks/week-05";
import { week06 } from "./weeks/week-06";
import { week07 } from "./weeks/week-07";
import { week08 } from "./weeks/week-08";
import { week09 } from "./weeks/week-09";
import { week10 } from "./weeks/week-10";
import { week11 } from "./weeks/week-11";
import { week12 } from "./weeks/week-12";
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
  week05,
  week06,
  week07,
  week08,
  week09,
  week10,
  week11,
  week12,
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
