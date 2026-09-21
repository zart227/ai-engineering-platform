import type { Week } from "./types";

export type WeekCompletionParts = {
  lessons: { done: number; total: number };
  lab: boolean;
  practice: boolean;
  artifact: boolean;
  quiz: boolean;
};

export function weekParts(week: Week, input: {
  completedLessons: Set<string>;
  labDone: boolean;
  practiceDone: boolean;
  artifactDone: boolean;
  quizPassed: boolean;
}): WeekCompletionParts {
  return {
    lessons: {
      done: week.lessons.filter((lesson) => input.completedLessons.has(lesson.id)).length,
      total: week.lessons.length,
    },
    lab: input.labDone,
    practice: input.practiceDone,
    artifact: input.artifactDone,
    quiz: input.quizPassed,
  };
}

export function weekPercent(parts: WeekCompletionParts) {
  const lessonScore = parts.lessons.total === 0 ? 1 : parts.lessons.done / parts.lessons.total;
  const scores = [
    lessonScore,
    parts.lab ? 1 : 0,
    parts.practice ? 1 : 0,
    parts.artifact ? 1 : 0,
    parts.quiz ? 1 : 0,
  ];
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
}

export function weekComplete(parts: WeekCompletionParts) {
  return (
    parts.lessons.total > 0 &&
    parts.lessons.done === parts.lessons.total &&
    parts.lab &&
    parts.practice &&
    parts.artifact &&
    parts.quiz
  );
}

export function scoreQuiz(answers: number[], correct: number[]) {
  if (correct.length === 0) return { score: 0, passed: false };
  let right = 0;
  for (let i = 0; i < correct.length; i += 1) {
    if (answers[i] === correct[i]) right += 1;
  }
  const score = Math.round((right / correct.length) * 100);
  return { score, passed: score >= 70 };
}
