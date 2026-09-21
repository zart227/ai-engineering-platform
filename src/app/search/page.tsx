import { weeks } from "@course";
import { glossary } from "@course/glossary";
import { SearchClient } from "./search-client";

export default function SearchPage() {
  const lessons = weeks.flatMap((week) =>
    week.lessons.map((lesson) => ({
      type: "lesson" as const,
      title: lesson.title,
      href: `/week/${week.slug}`,
      text: lesson.blocks
        .map((block) => ("text" in block ? block.text : ""))
        .join(" ")
        .slice(0, 280),
    }))
  );
  const terms = glossary.map((item) => ({
    type: "glossary" as const,
    title: item.term,
    href: `/glossary#${item.id}`,
    text: item.definition,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl">Поиск</h1>
      <SearchClient items={[...lessons, ...terms]} />
    </div>
  );
}
