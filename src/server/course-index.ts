import { weeks } from "@course";
import { glossary } from "@course/glossary";
import type { ContentBlock } from "@course/types";
import { EMBEDDING_MODEL, embedText } from "@/server/embeddings";

export type CourseChunk = {
  id: string;
  kind: "lesson" | "glossary";
  weekSlug: string | null;
  title: string;
  href: string;
  body: string;
  embedding: number[];
};

function blockText(block: ContentBlock) {
  if (block.type === "ul" || block.type === "ol") return block.items.join(" ");
  if (block.type === "reading") return block.items.map((item) => `${item.title} ${item.note ?? ""}`).join(" ");
  if (block.type === "compare") return `${block.title} ${block.bad} ${block.good}`;
  if (block.type === "check") return `${block.question} ${block.answer}`;
  if ("text" in block && typeof block.text === "string") return block.text;
  return "";
}

export function buildCourseChunks(): CourseChunk[] {
  const lessons = weeks.flatMap((week) =>
    week.lessons.map((lesson) => {
      const body = [week.title, lesson.title, ...lesson.blocks.map(blockText)].join("\n").slice(0, 4000);
      const lead = [lesson.title, lesson.title, ...lesson.objectives, body.slice(0, 900)].join("\n");
      return {
        id: `lesson:${lesson.id}`,
        kind: "lesson" as const,
        weekSlug: week.slug,
        title: lesson.title,
        href: `/week/${week.slug}`,
        body,
        embedding: embedText(lead),
      };
    })
  );
  const terms = glossary.map((term) => {
    const body = `${term.term}\n${term.definition}`;
    return {
      id: `glossary:${term.id}`,
      kind: "glossary" as const,
      weekSlug: term.weekSlug ?? null,
      title: term.term,
      href: `/glossary#${term.id}`,
      body,
      embedding: embedText(body),
    };
  });
  return [...lessons, ...terms];
}

export function courseIndexStamp(chunks: CourseChunk[]) {
  const payload = chunks.map((chunk) => `${chunk.id}\n${chunk.body}`).join("\n");
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${EMBEDDING_MODEL}:${chunks.length}:${(hash >>> 0).toString(16)}`;
}
