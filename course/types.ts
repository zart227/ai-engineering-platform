export type Track = "engineering" | "automation" | "product" | "shared";
export type WeekStatus = "ready" | "outlined";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | {
      type: "callout";
      title: string;
      text: string;
      tone?: "info" | "warn" | "security" | "cost";
    }
  | { type: "prompt"; title: string; text: string }
  | { type: "compare"; title: string; bad: string; good: string }
  | { type: "code"; language: string; title?: string; text: string }
  | { type: "diagram"; title?: string; text: string }
  | { type: "check"; question: string; answer: string }
  | {
      type: "reading";
      items: { title: string; url: string; note?: string }[];
    };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  objectives: string[];
  blocks: ContentBlock[];
};

export type LabStep = {
  title: string;
  body: string;
  expected?: string;
};

export type Lab = {
  id: string;
  title: string;
  goal: string;
  setup: string[];
  steps: LabStep[];
  troubleshooting: { problem: string; fix: string }[];
  reflection: string[];
};

export type Hint = {
  title: string;
  text: string;
};

export type Exercise = {
  id: string;
  title: string;
  time: string;
  context: string;
  requirements: string[];
  constraints: string[];
  acceptance: string[];
  tests: string[];
  hints: Hint[];
  solution: string;
};

export type PromptTemplate = {
  id: string;
  title: string;
  purpose: string;
  when: string;
  text: string;
  placeholders: string[];
  explanation: string;
  limitations: string;
};

export type QuizKind = "conceptual" | "scenario" | "architecture" | "debugging";

export type QuizQuestion = {
  id: string;
  kind: QuizKind;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  passScore: number;
  questions: QuizQuestion[];
};

export type ArtifactSpec = {
  result: string;
  repository: string;
  demo: string;
  readme: string[];
  architecture: string[];
  tests: string[];
  checklist: { id: string; text: string }[];
};

export type CourseSource = {
  title: string;
  url: string;
  kind: "official-docs" | "paper" | "reference";
  checkedAt: string;
};

export type MetricSpec = { name: string; how: string };

export type ExperimentSpec = {
  id: string;
  question: string;
  method: string;
  metrics: string[];
};

export type FailureMode = {
  id: string;
  symptom: string;
  cause: string;
  check: string;
};

export type RubricCriterion = {
  id: string;
  name: string;
  weight: number;
  evidence: string;
};

export type ArtifactRubric = {
  criteria: RubricCriterion[];
};

export type DecisionCard = {
  id: string;
  title: string;
  optionA: string;
  optionB: string;
  useA: string[];
  useB: string[];
  tradeoffs: string;
  mistake: string;
};

export type RecallItem = {
  question: string;
  answer: string;
  fromWeek: string;
};

export type WeekOverview = {
  why: string;
  prerequisites: string[];
  productionUse: string[];
  previousKnowledge: string[];
  asOf?: string;
};

export type Week = {
  id: number;
  slug: string;
  moduleId: string;
  title: string;
  short: string;
  track: Track;
  status: WeekStatus;
  hours: number;
  goal: string;
  technologies: string[];
  overview: WeekOverview;
  lessons: Lesson[];
  lab: Lab;
  practice: Exercise;
  prompts: PromptTemplate[];
  quiz: Quiz;
  artifact: ArtifactSpec;
  recall: RecallItem[];
  decisionCards: DecisionCard[];
  learningObjectives?: string[];
  experiments?: ExperimentSpec[];
  failureModes?: FailureMode[];
  metrics?: MetricSpec[];
  artifactRubric?: ArtifactRubric;
  sources?: CourseSource[];
  contentVersion?: string;
  lastReviewedAt?: string;
  securityNotes?: string[];
  privacyNotes?: string[];
  costNotes?: string[];
  productionNotes?: string[];
};

export type CourseModule = {
  id: string;
  number: number;
  title: string;
  short: string;
  description: string;
  weekSlugs: string[];
};

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  weekSlug?: string;
  related: string[];
};

export type LearningMapNode = {
  id: string;
  label: string;
  track: Track;
  weekSlug?: string;
};

export const courseMeta = {
  title: "AI Engineering Platform",
  program: "AI Engineer & Automation Developer",
  tagline:
    "От основ LLM и автоматизации до RAG, MCP, AI-агентов, multi-agent систем и production AI-продуктов",
  length: "32 недели + capstone",
  hours: "300-400 часов",
  about:
    "Самостоятельная программа для разработчика: AI Engineering, автоматизация и путь от идеи до production AI-продукта. Практика 65-70%. Каждая неделя заканчивается артефактом.",
};
