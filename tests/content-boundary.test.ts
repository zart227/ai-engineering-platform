import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ContentBlock, Lesson } from "../course/types";
import { weeks } from "../course";
import { buildCourseChunkDescriptors, buildCourseChunks } from "../src/server/course-index";
import { rankChunks } from "../src/server/semantic-search";
import {
  serializeContentBlock,
  serializeLessonBlocks,
  serializeLessonForIndex,
} from "../src/server/student-visible-course";

const CHECK_ANSWER_SECRET = "CHECK-ANSWER-SECRET-9h1";
const PRACTICE_SOLUTION_SECRET = "PRACTICE-SOLUTION-SECRET-9h1";
const QUIZ_ANSWER_SECRET = "QUIZ-ANSWER-SECRET-9h1";
const QUIZ_EXPLANATION_SECRET = "QUIZ-EXPLANATION-SECRET-9h1";
const RECALL_ANSWER_SECRET = "RECALL-ANSWER-SECRET-9h1";

const FORBIDDEN = [
  CHECK_ANSWER_SECRET,
  PRACTICE_SOLUTION_SECRET,
  QUIZ_ANSWER_SECRET,
  QUIZ_EXPLANATION_SECRET,
  RECALL_ANSWER_SECRET,
];

function fixtureLesson(): Lesson {
  return {
    id: "boundary-fixture-l1",
    title: "Boundary fixture lesson",
    minutes: 10,
    objectives: ["Verify student-safe serialization"],
    blocks: [
      { type: "p", text: "Visible paragraph text." },
      { type: "h", text: "Visible heading" },
      { type: "ul", items: ["list item one", "list item two"] },
      { type: "ol", items: ["ordered step"] },
      { type: "callout", title: "Note", text: "callout body" },
      { type: "prompt", title: "Prompt", text: "prompt body" },
      { type: "compare", title: "Compare", bad: "bad example", good: "good example" },
      { type: "code", language: "ts", text: "const visible = true;" },
      { type: "diagram", text: "diagram -> arrow" },
      {
        type: "reading",
        items: [{ title: "Docs", url: "https://example.com", note: "reference" }],
      },
      { type: "check", question: "CHECK-QUESTION-VISIBLE", answer: CHECK_ANSWER_SECRET },
    ],
  };
}

describe("student-visible course content boundary", () => {
  it("serializes theory blocks and check.question but never check.answer", () => {
    const lesson = fixtureLesson();
    const serialized = serializeLessonForIndex(lesson);
    const blocks = serializeLessonBlocks(lesson.blocks);

    assert.match(serialized, /Visible paragraph text/);
    assert.match(serialized, /Visible heading/);
    assert.match(serialized, /list item one/);
    assert.match(serialized, /ordered step/);
    assert.match(serialized, /callout body/);
    assert.match(serialized, /prompt body/);
    assert.match(serialized, /bad example/);
    assert.match(serialized, /good example/);
    assert.match(serialized, /const visible = true/);
    assert.match(serialized, /diagram -> arrow/);
    assert.match(serialized, /reference/);
    assert.match(serialized, /CHECK-QUESTION-VISIBLE/);

    for (const secret of FORBIDDEN) {
      assert.equal(serialized.includes(secret), false, `serializeLessonForIndex leaked ${secret}`);
      assert.equal(blocks.includes(secret), false, `serializeLessonBlocks leaked ${secret}`);
    }
  });

  it("serializeContentBlock on check returns question only", () => {
    const block: ContentBlock = {
      type: "check",
      question: "What is a token?",
      answer: CHECK_ANSWER_SECRET,
    };
    const text = serializeContentBlock(block);
    assert.equal(text, "What is a token?");
    assert.equal(text.includes(CHECK_ANSWER_SECRET), false);
  });

  it("buildCourseChunkDescriptors never embeds hidden answers from the live curriculum", () => {
    const descriptors = buildCourseChunkDescriptors();
    assert.ok(descriptors.length > 30);

    for (const week of weeks) {
      for (const lesson of week.lessons) {
        const descriptor = descriptors.find((item) => item.id === `lesson:${lesson.id}`);
        assert.ok(descriptor, `missing descriptor for ${lesson.id}`);

        for (const block of lesson.blocks) {
          if (block.type === "check") {
            assert.equal(descriptor.body.includes(block.answer), false, `${lesson.id} leaked check.answer`);
            const lessonOnly = serializeLessonForIndex(lesson);
            const questionPrefix = block.question.slice(0, Math.min(20, block.question.length));
            assert.equal(lessonOnly.includes(questionPrefix), true, `${lesson.id} missing check.question in serializer`);
            assert.equal(lessonOnly.includes(block.answer), false, `${lesson.id} serializer leaked check.answer`);
          }
        }
      }

      assert.equal(descriptorTextIncludes(descriptors, week.practice.solution), false, `${week.slug} leaked practice.solution`);

      for (const question of week.quiz.questions) {
        assert.equal(descriptorTextIncludes(descriptors, question.explanation), false, `${week.slug} leaked quiz explanation`);
      }

      for (const item of week.recall) {
        assert.equal(descriptorTextIncludes(descriptors, item.answer), false, `${week.slug} leaked recall.answer`);
      }
    }
  });

  it("CourseChunk body and search hit text exclude CHECK-ANSWER-SECRET sentinel", () => {
    const lesson = fixtureLesson();
    const body = serializeLessonForIndex(lesson);
    const chunks = buildCourseChunks([
      {
        id: "lesson:boundary-fixture-l1",
        kind: "lesson",
        weekSlug: "fixture",
        title: lesson.title,
        href: "/week/fixture",
        body,
        embedSource: body,
      },
    ]);

    assert.equal(chunks[0]?.body.includes(CHECK_ANSWER_SECRET), false);

    assert.match(chunks[0]?.body ?? "", /CHECK-QUESTION-VISIBLE/);

    const hits = rankChunks("CHECK-QUESTION-VISIBLE boundary fixture", chunks, 5);
    assert.ok(hits.length > 0);
    for (const hit of hits) {
      assert.equal(hit.text.includes(CHECK_ANSWER_SECRET), false, "search hit leaked check.answer sentinel");
      assert.match(hit.text, /CHECK-QUESTION-VI/);
    }
  });
});

function descriptorTextIncludes(descriptors: { body: string }[], needle: string) {
  if (!needle.trim()) return false;
  return descriptors.some((descriptor) => descriptor.body.includes(needle));
}
