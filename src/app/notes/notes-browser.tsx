"use client";

import { useMemo, useState } from "react";

export function NotesBrowser({
  notes,
  weeks,
  modules,
}: {
  notes: { id: string; key: string; body: string; weekSlug: string | null; tags: string[]; updatedAt: string }[];
  weeks: { slug: string; short: string; moduleId: string }[];
  modules: { id: string; title: string }[];
}) {
  const [query, setQuery] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [weekSlug, setWeekSlug] = useState("");

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      if (query && !`${note.body} ${note.key}`.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (weekSlug && note.weekSlug !== weekSlug) return false;
      if (moduleId) {
        const week = weeks.find((item) => item.slug === note.weekSlug);
        if (week?.moduleId !== moduleId) return false;
      }
      return true;
    });
  }, [notes, query, moduleId, weekSlug, weeks]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск"
          className="rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
        />
        <select
          value={moduleId}
          onChange={(event) => setModuleId(event.target.value)}
          className="rounded-lg border border-input bg-card px-2 py-2 text-sm"
        >
          <option value="">Все модули</option>
          {modules.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <select
          value={weekSlug}
          onChange={(event) => setWeekSlug(event.target.value)}
          className="rounded-lg border border-input bg-card px-2 py-2 text-sm"
        >
          <option value="">Все недели</option>
          {weeks.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.short}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока пусто. Пишите в неделях, здесь соберётся.</p>
        ) : null}
        {filtered.map((note) => (
          <article key={note.id} className="rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">
              {note.key} · {note.weekSlug ?? "без недели"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.body || "—"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
