export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | { type: "prompt"; title: string; text: string }
  | { type: "compare"; title: string; bad: string; good: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  blocks: ContentBlock[];
};

export type Exercise = {
  id: string;
  title: string;
  time: string;
  goal: string;
  steps: string[];
  output: string;
};

export type PromptCard = {
  id: string;
  title: string;
  when: string;
  text: string;
};

export type Week = {
  id: number;
  slug: string;
  title: string;
  short: string;
  goal: string;
  artifact: string;
  tools: string[];
  theory: Lesson[];
  practice: Exercise[];
  prompts: PromptCard[];
  checklist: { id: string; text: string }[];
};
