import type { Week, Track, WeekStatus, ContentBlock } from "../types";
import {
  artifact,
  callout,
  code,
  decision,
  exercise,
  lab,
  lesson,
  p,
  promptT,
  q,
  quiz,
  ul,
  week,
} from "../blocks";

export type CompactLesson = {
  title: string;
  minutes: number;
  objectives: string[];
  paragraphs: string[];
  bullets?: string[];
  codeSample?: { language: string; title?: string; text: string };
  callout?: { title: string; text: string; tone?: "info" | "warn" | "security" | "cost" };
};

export type CompactWeek = {
  id: number;
  slug: string;
  moduleId: string;
  title: string;
  short: string;
  track: Track;
  status?: WeekStatus;
  hours: number;
  goal: string;
  technologies: string[];
  why: string;
  prerequisites: string[];
  productionUse: string[];
  previousKnowledge: string[];
  asOf?: string;
  lessons: CompactLesson[];
  lab: {
    title: string;
    goal: string;
    setup: string[];
    steps: { title: string; body: string; expected?: string }[];
    troubleshooting?: { problem: string; fix: string }[];
    reflection: string[];
  };
  practice: {
    title: string;
    time: string;
    context: string;
    requirements: string[];
    constraints: string[];
    acceptance: string[];
    tests: string[];
    hints: { title: string; text: string }[];
    solution: string;
  };
  prompt: {
    title: string;
    purpose: string;
    when: string;
    placeholders: string[];
    text: string;
    explanation: string;
    limitations: string;
  };
  quiz: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
    kind?: "conceptual" | "scenario" | "architecture" | "debugging";
  }[];
  artifactResult: string;
  checklist: string[];
  recall?: { fromWeek: string; question: string; answer: string }[];
  decisionCard?: {
    title: string;
    optionA: string;
    optionB: string;
    useA: string[];
    useB: string[];
    tradeoffs: string;
    mistake: string;
  };
};

function lessonBlocks(item: CompactLesson): ContentBlock[] {
  const blocks: ContentBlock[] = item.paragraphs.map((text) => p(text));
  if (item.bullets?.length) blocks.push(ul(item.bullets));
  if (item.codeSample) {
    blocks.push(code(item.codeSample.language, item.codeSample.text, item.codeSample.title));
  }
  if (item.callout) {
    blocks.push(callout(item.callout.title, item.callout.text, item.callout.tone));
  }
  return blocks;
}

export function compactWeek(spec: CompactWeek): Week {
  const slug = spec.slug;
  return week({
    id: spec.id,
    slug,
    moduleId: spec.moduleId,
    title: spec.title,
    short: spec.short,
    track: spec.track,
    status: spec.status ?? "outlined",
    hours: spec.hours,
    goal: spec.goal,
    technologies: spec.technologies,
    overview: {
      why: spec.why,
      prerequisites: spec.prerequisites,
      productionUse: spec.productionUse,
      previousKnowledge: spec.previousKnowledge,
      asOf: spec.asOf,
    },
    lessons: spec.lessons.map((item, index) =>
      lesson(
        `${slug}-l${index + 1}`,
        item.title,
        item.minutes,
        item.objectives,
        lessonBlocks(item)
      )
    ),
    lab: lab({
      id: `${slug}-lab`,
      title: spec.lab.title,
      goal: spec.lab.goal,
      setup: spec.lab.setup,
      steps: spec.lab.steps,
      troubleshooting: spec.lab.troubleshooting ?? [],
      reflection: spec.lab.reflection,
    }),
    practice: exercise({
      id: `${slug}-practice`,
      ...spec.practice,
    }),
    prompts: [
      promptT({
        id: `${slug}-p1`,
        ...spec.prompt,
      }),
    ],
    quiz: quiz(
      `${slug}-quiz`,
      spec.quiz.map((item, index) =>
        q(
          `${slug}-q${index + 1}`,
          item.kind ?? "conceptual",
          item.prompt,
          item.options,
          item.answer,
          item.explanation
        )
      )
    ),
    artifact: artifact({
      result: spec.artifactResult,
      repository: "Git URL в журнале проекта",
      demo: "Ссылка или запись запуска",
      readme: ["цель", "запуск", "ограничения", "стоимость если есть LLM"],
      architecture: ["описать в README одним абзацем и схемой"],
      tests: spec.practice.tests,
      checklist: spec.checklist.map((text, index) => ({
        id: `${slug}-a${index + 1}`,
        text,
      })),
    }),
    recall: spec.recall ?? [],
    decisionCards: spec.decisionCard
      ? [
          decision({
            id: `${slug}-d1`,
            ...spec.decisionCard,
          }),
        ]
      : [],
  });
}
