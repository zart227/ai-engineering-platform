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
import { week13 } from "./weeks/week-13";
import { week14 } from "./weeks/week-14";
import { week15 } from "./weeks/week-15";
import { week16 } from "./weeks/week-16";
import { week17 } from "./weeks/week-17";
import { week18 } from "./weeks/week-18";
import { week19 } from "./weeks/week-19";
import { week20 } from "./weeks/week-20";
import { week21 } from "./weeks/week-21";
import { week22 } from "./weeks/week-22";
import { week23 } from "./weeks/week-23";
import { week24 } from "./weeks/week-24";
import { week25 } from "./weeks/week-25";
import { week26 } from "./weeks/week-26";
import { week27 } from "./weeks/week-27";
import { week28 } from "./weeks/week-28";
import { week29 } from "./weeks/week-29";
import { week30 } from "./weeks/week-30";
import { week31 } from "./weeks/week-31";
import { week32 } from "./weeks/week-32";
import { week33 } from "./weeks/week-33";

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
  week13,
  week14,
  week15,
  week16,
  week17,
  week18,
  week19,
  week20,
  week21,
  week22,
  week23,
  week24,
  week25,
  week26,
  week27,
  week28,
  week29,
  week30,
  week31,
  week32,
  week33,
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
