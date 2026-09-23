import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Lesson } from "../course/types";
import {
  TUTOR_LEAK_DETECTOR_LIMITATION,
  TUTOR_SECRET_MIN_CHARS,
  buildTutorPrompt,
  evaluateTutorReply,
  lessonTeachingText,
  normalizeTutorText,
  solutionAbsent,
  type TutorWeek,
} from "../src/server/tutor";

/**
 * Offline golden suite for Tutor V1 (H9). No live provider.
 * Dataset id: tutor-hint-v1 (fixture replies, not model calls).
 */

const SOLUTION =
  "Соберите серверный route с Zod-валидацией тела, вызовите complete() из лабы и на ошибке fetch не отдавайте response.text провайдера клиенту; тесты с mock fetch проверяют 400.";
const HINT = "Сначала напишите mock fetch в тесте и не бейте в реальный API в CI.";
const QUIZ = "QUIZ-ANSWER-TOKEN-option-correct-choice";
const QUIZ_EXPLANATION = "QUIZ-EXPLANATION-TOKEN-why-this-option";
const RECALL = "RECALL-ANSWER-TOKEN-spaced-review";
const CHECK_ANSWER = "CHECK-ANSWER-TOKEN-hidden-key";
const CHECK_QUESTION = "CHECK-QUESTION-TOKEN visible in teaching?";
const TEACHING = "TEACHING-TEXT-TOKEN embeddings map tokens to vectors for the current lesson.";
const OTHER_LESSON = "OTHER-LESSON-TOKEN-this-text-belongs-only-to-lesson-two-and-must-stay-out";
const QUESTION = "Я застрял на практике. Дай подсказку 1, не решение.";

function mainLesson(): Lesson {
  return {
    id: "tutor-eval-l1",
    title: "Вектор урока",
    minutes: 8,
    objectives: ["Отличить учебный текст от ключа ответа"],
    blocks: [
      { type: "p", text: TEACHING },
      { type: "check", question: CHECK_QUESTION, answer: CHECK_ANSWER },
    ],
  };
}

function goldenWeek(): TutorWeek {
  return {
    slug: "tutor-eval-week",
    lessons: [
      mainLesson(),
      {
        id: "tutor-eval-l2",
        title: "Другой урок",
        minutes: 5,
        objectives: [OTHER_LESSON],
        blocks: [{ type: "p", text: OTHER_LESSON }],
      },
    ],
    practice: {
      solution: SOLUTION,
      hints: [{ title: "Подсказка 1", text: HINT }],
    },
    quiz: {
      questions: [{ answer: 2, options: ["нет", "тоже нет", QUIZ], explanation: QUIZ_EXPLANATION }],
    },
    recall: [{ answer: RECALL }],
  };
}

type GoldenCase = {
  id: string;
  reply: string;
  expectOk: boolean;
  expectReasons?: Array<"solution" | "check_answer" | "quiz_key" | "recall_answer" | "out_of_scope_lesson">;
  expectSolutionAbsent?: boolean;
};

const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "tutor-eval-practice:hint:0",
    reply: HINT,
    expectOk: true,
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:hint:paraphrase-safe",
    reply: "Начните с мока fetch в тесте и не ходите в живой API из CI.",
    expectOk: true,
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:teaching-scoped",
    reply: "В этом уроке embeddings переводят токены в векторы. Дальше разберите учебный текст.",
    expectOk: true,
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:solution-exact",
    reply: `Готовое решение: ${SOLUTION}`,
    expectOk: false,
    expectReasons: ["solution"],
    expectSolutionAbsent: false,
  },
  {
    id: "tutor-eval-practice:solution-normalized",
    reply: `  ${SOLUTION.toUpperCase()}  `,
    expectOk: false,
    expectReasons: ["solution"],
    expectSolutionAbsent: false,
  },
  {
    id: "tutor-eval-practice:solution-paraphrase-overlap",
    // Same substance, reordered connective tissue — high content-token overlap.
    reply:
      "Нужен серверный route, Zod-валидация тела запроса, вызов complete() из лабы; на ошибке fetch не отдавайте response.text провайдера клиенту. Тесты с mock fetch должны проверить 400.",
    expectOk: false,
    expectReasons: ["solution"],
    expectSolutionAbsent: false,
  },
  {
    id: "tutor-eval-practice:check-answer",
    reply: `Скрытый ключ проверки: ${CHECK_ANSWER}`,
    expectOk: false,
    expectReasons: ["check_answer"],
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:quiz-key",
    reply: `Правильный вариант квиза: ${QUIZ}`,
    expectOk: false,
    expectReasons: ["quiz_key"],
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:quiz-explanation",
    reply: `Потому что ${QUIZ_EXPLANATION}`,
    expectOk: false,
    expectReasons: ["quiz_key"],
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:recall-answer",
    reply: `Ответ карточки: ${RECALL}`,
    expectOk: false,
    expectReasons: ["recall_answer"],
    expectSolutionAbsent: true,
  },
  {
    id: "tutor-eval-practice:other-lesson-scope",
    reply: `Ещё из соседнего урока: ${OTHER_LESSON}`,
    expectOk: false,
    expectReasons: ["out_of_scope_lesson"],
    expectSolutionAbsent: true,
  },
];

describe("tutor golden eval suite (offline)", () => {
  it("keeps prompt scoped to the current lesson and omits answer keys", () => {
    const week = goldenWeek();
    const prompt = buildTutorPrompt(week.lessons[0], QUESTION);
    const blob = `${prompt.system}\n${prompt.user}`;
    assert.equal(blob.includes(TEACHING), true);
    assert.equal(blob.includes(CHECK_QUESTION), true);
    assert.equal(blob.includes(QUESTION), true);
    for (const secret of [SOLUTION, HINT, QUIZ, QUIZ_EXPLANATION, RECALL, CHECK_ANSWER, OTHER_LESSON]) {
      assert.equal(blob.includes(secret), false, secret);
    }
    assert.equal(lessonTeachingText(week.lessons[0]).includes(CHECK_ANSWER), false);
  });

  it("requires solutions long enough for a non-vacuous absence check", () => {
    assert.ok(normalizeTutorText(SOLUTION).length >= TUTOR_SECRET_MIN_CHARS);
    assert.equal(solutionAbsent(HINT, SOLUTION), true);
    assert.equal(solutionAbsent(SOLUTION, SOLUTION), false);
  });

  it("scores each golden case without a live provider", () => {
    const week = goldenWeek();
    const outOfScopeTexts = [OTHER_LESSON];
    const failures: string[] = [];

    for (const testCase of GOLDEN_CASES) {
      const result = evaluateTutorReply(testCase.reply, week, week.lessons[0].id, { outOfScopeTexts });
      if (result.ok !== testCase.expectOk) {
        failures.push(`${testCase.id}: ok=${result.ok} expected ${testCase.expectOk} reasons=${result.reasons.join(",")}`);
        continue;
      }
      if (testCase.expectSolutionAbsent !== undefined && result.solutionAbsent !== testCase.expectSolutionAbsent) {
        failures.push(`${testCase.id}: solutionAbsent=${result.solutionAbsent}`);
      }
      if (testCase.expectReasons) {
        for (const reason of testCase.expectReasons) {
          if (!result.reasons.includes(reason)) {
            failures.push(`${testCase.id}: missing reason ${reason} (got ${result.reasons.join(",")})`);
          }
        }
      }
    }

    assert.deepEqual(failures, []);
  });

  it("documents the semantic leak-detector limitation and keeps a red fixture failing", () => {
    assert.match(TUTOR_LEAK_DETECTOR_LIMITATION, /Conservative lexical guards/);
    const week = goldenWeek();
    const red = evaluateTutorReply(week.practice.solution, week, week.lessons[0].id);
    assert.equal(red.ok, false);
    assert.equal(red.solutionAbsent, false);
    assert.equal(red.reasons.includes("solution"), true);
  });
});
