import type {
  ContentBlock,
  Exercise,
  Lesson,
  QuizQuestion,
  RecallItem,
  Week,
} from "@course/types";

export type ClientCheckBlock = { type: "check"; question: string };

export type ClientContentBlock = Exclude<ContentBlock, { type: "check" }> | ClientCheckBlock;

export type ClientLesson = Omit<Lesson, "blocks"> & { blocks: ClientContentBlock[] };

export type ClientPracticeHint = { title: string; text: string };

export type ClientExercise = Omit<Exercise, "solution" | "hints"> & {
  hints: ClientPracticeHint[];
  hintsTotal: number;
};

export type ClientQuizQuestion = Omit<QuizQuestion, "answer" | "explanation">;

export type ClientRecallItem = Omit<RecallItem, "answer">;

export type WeekClientPayload = Omit<Week, "lessons" | "practice" | "quiz" | "recall"> & {
  lessons: ClientLesson[];
  practice: ClientExercise;
  quiz: Omit<Week["quiz"], "questions"> & { questions: ClientQuizQuestion[] };
  recall: ClientRecallItem[];
};

function stripBlock(block: ContentBlock): ClientContentBlock {
  if (block.type === "check") {
    return { type: "check", question: block.question };
  }
  return block;
}

export function toWeekClientPayload(
  week: Week,
  options?: { hintsUnlocked?: number }
): WeekClientPayload {
  const unlocked = Math.max(0, Math.min(options?.hintsUnlocked ?? 0, week.practice.hints.length));
  const { solution: _solution, hints, ...practiceRest } = week.practice;
  void _solution;

  return {
    ...week,
    lessons: week.lessons.map((lesson) => ({
      ...lesson,
      blocks: lesson.blocks.map(stripBlock),
    })),
    practice: {
      ...practiceRest,
      hints: hints.slice(0, unlocked).map((hint) => ({ title: hint.title, text: hint.text })),
      hintsTotal: hints.length,
    },
    quiz: {
      id: week.quiz.id,
      passScore: week.quiz.passScore,
      questions: week.quiz.questions.map((question) => ({
        id: question.id,
        kind: question.kind,
        prompt: question.prompt,
        options: question.options,
      })),
    },
    recall: week.recall.map((item) => ({
      question: item.question,
      fromWeek: item.fromWeek,
    })),
  };
}
