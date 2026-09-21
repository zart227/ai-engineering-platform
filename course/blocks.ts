import type {
  ArtifactSpec,
  ContentBlock,
  DecisionCard,
  Exercise,
  Lab,
  Lesson,
  PromptTemplate,
  Quiz,
  QuizQuestion,
  RecallItem,
  Week,
} from "./types";

export const p = (text: string): ContentBlock => ({ type: "p", text });
export const h = (text: string): ContentBlock => ({ type: "h", text });
export const ul = (items: string[]): ContentBlock => ({ type: "ul", items });
export const ol = (items: string[]): ContentBlock => ({ type: "ol", items });
export const callout = (
  title: string,
  text: string,
  tone: "info" | "warn" | "security" | "cost" = "info"
): ContentBlock => ({ type: "callout", title, text, tone });
export const compare = (title: string, bad: string, good: string): ContentBlock => ({
  type: "compare",
  title,
  bad,
  good,
});
export const code = (language: string, text: string, title?: string): ContentBlock => ({
  type: "code",
  language,
  text,
  title,
});
export const diagram = (text: string, title?: string): ContentBlock => ({
  type: "diagram",
  text,
  title,
});
export const check = (question: string, answer: string): ContentBlock => ({
  type: "check",
  question,
  answer,
});
export const reading = (
  items: { title: string; url: string; note?: string }[]
): ContentBlock => ({ type: "reading", items });

export function lesson(
  id: string,
  title: string,
  minutes: number,
  objectives: string[],
  blocks: ContentBlock[]
): Lesson {
  return { id, title, minutes, objectives, blocks };
}

export function lab(partial: Lab): Lab {
  return partial;
}

export function exercise(partial: Exercise): Exercise {
  return partial;
}

export function promptT(partial: PromptTemplate): PromptTemplate {
  return partial;
}

export function quiz(id: string, questions: QuizQuestion[], passScore = 70): Quiz {
  return { id, passScore, questions };
}

export function q(
  id: string,
  kind: QuizQuestion["kind"],
  prompt: string,
  options: string[],
  answer: number,
  explanation: string
): QuizQuestion {
  return { id, kind, prompt, options, answer, explanation };
}

export function artifact(partial: ArtifactSpec): ArtifactSpec {
  return partial;
}

export function decision(partial: DecisionCard): DecisionCard {
  return partial;
}

export function recall(items: RecallItem[]): RecallItem[] {
  return items;
}

export function week(partial: Week): Week {
  return partial;
}
