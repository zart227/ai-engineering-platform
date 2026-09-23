import type { ContentBlock, Lesson } from "@course/types";

/**
 * Serializes one content block for student-visible surfaces (search index, MCP, tutor).
 * Includes theory blocks and check.question only — never check.answer.
 */
export function serializeContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case "p":
    case "h":
    case "code":
    case "diagram":
      return block.text;
    case "ul":
    case "ol":
      return block.items.join(" ");
    case "callout":
    case "prompt":
      return `${block.title} ${block.text}`;
    case "compare":
      return `${block.title} ${block.bad} ${block.good}`;
    case "reading":
      return block.items.map((item) => `${item.title} ${item.note ?? ""}`).join(" ");
    case "check":
      return block.question;
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

/** Joins lesson blocks into searchable student-visible text. */
export function serializeLessonBlocks(blocks: ContentBlock[]): string {
  return blocks.map(serializeContentBlock).filter((line) => line.trim().length > 0).join("\n");
}

/** Lesson title, objectives, and student-visible block text for indexing. */
export function serializeLessonForIndex(lesson: Lesson): string {
  return [lesson.title, ...lesson.objectives, serializeLessonBlocks(lesson.blocks)].filter(Boolean).join("\n");
}
