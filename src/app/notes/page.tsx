import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { weeks, modules } from "@course";
import { NotesBrowser } from "./notes-browser";

export default async function NotesPage() {
  const user = await requireUser();
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-4xl">Заметки</h1>
      <p className="mt-2 text-sm text-muted-foreground">Поиск по тексту, фильтр по неделе и модулю.</p>
      <NotesBrowser
        notes={notes.map((note) => ({
          id: note.id,
          key: note.key,
          body: note.body,
          weekSlug: note.weekSlug,
          tags: note.tags,
          updatedAt: note.updatedAt.toISOString(),
        }))}
        weeks={weeks.map((week) => ({
          slug: week.slug,
          short: week.short,
          moduleId: week.moduleId,
        }))}
        modules={modules.map((item) => ({ id: item.id, title: item.title }))}
      />
    </div>
  );
}
