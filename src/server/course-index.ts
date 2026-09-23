import { weeks } from "@course";
import { glossary } from "@course/glossary";
import { EMBEDDING_MODEL, embedText } from "@/server/embeddings";
import { serializeLessonForIndex } from "@/server/student-visible-course";

export type CourseChunkDescriptor = {
  id: string;
  kind: "lesson" | "glossary";
  weekSlug: string | null;
  title: string;
  href: string;
  body: string;
  embedSource: string;
};

export type CourseChunk = CourseChunkDescriptor & {
  embedding: number[];
};

export function buildCourseChunkDescriptors(): CourseChunkDescriptor[] {
  const lessons = weeks.flatMap((week) =>
    week.lessons.map((lesson) => {
      const lessonText = serializeLessonForIndex(lesson);
      const body = [week.title, lessonText].join("\n").slice(0, 4000);
      const embedSource = [lesson.title, lesson.title, ...lesson.objectives, body.slice(0, 900)].join("\n");
      return {
        id: `lesson:${lesson.id}`,
        kind: "lesson" as const,
        weekSlug: week.slug,
        title: lesson.title,
        href: `/week/${week.slug}`,
        body,
        embedSource,
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
      embedSource: body,
    };
  });
  return [...lessons, ...terms];
}

export function buildCourseChunks(descriptors = buildCourseChunkDescriptors()): CourseChunk[] {
  return descriptors.map((descriptor) => ({
    ...descriptor,
    embedding: embedText(descriptor.embedSource),
  }));
}

export function expectedCourseIndexStamp(descriptors = buildCourseChunkDescriptors()) {
  return courseIndexStamp(descriptors);
}

export function courseIndexStamp(chunks: Array<Pick<CourseChunkDescriptor, "id" | "body">>) {
  const payload = chunks.map((chunk) => `${chunk.id}\n${chunk.body}`).join("\n");
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${EMBEDDING_MODEL}:${chunks.length}:${(hash >>> 0).toString(16)}`;
}
