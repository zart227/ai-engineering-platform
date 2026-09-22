"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  lesson: "урок",
  glossary: "глоссарий",
};

type Hit = { id: string; kind: string; title: string; href: string; text: string; score: number };

export function SearchClient({
  query,
  hits,
  error,
}: {
  query: string;
  hits: Hit[];
  error: string;
}) {
  const [value, setValue] = useState(query);
  const [found, setFound] = useState(hits);
  const [message, setMessage] = useState(error);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    const needle = next.trim();
    if (needle.length < 2) {
      setFound([]);
      setMessage("");
      return;
    }
    timer.current = setTimeout(() => {
      const params = new URLSearchParams({ q: needle });
      void fetch(`/api/search?${params.toString()}`)
        .then(async (response) => {
          const payload = (await response.json()) as { ok?: boolean; hits?: Hit[]; error?: string };
          if (!response.ok || payload.ok === false) {
            setFound([]);
            setMessage(payload.error || "Поиск не ответил.");
            return;
          }
          setMessage("");
          setFound(payload.hits ?? []);
        })
        .catch(() => {
          setFound([]);
          setMessage("Поиск не ответил.");
        });
    }, 200);
  }

  return (
    <div className="mt-6">
      <form action="/search" method="get" className="flex gap-2">
        <label className="sr-only" htmlFor="search-q">
          Запрос
        </label>
        <input
          id="search-q"
          name="q"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Урок, термин, кусок теории"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg border border-border px-4 text-sm">
          Найти
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-destructive">{message}</p> : null}
      <ul className="mt-6 space-y-3">
        {found.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">
              {typeLabels[item.kind] ?? item.kind}
              {Number.isFinite(item.score) ? ` · ${item.score.toFixed(2)}` : ""}
            </p>
            <Link href={item.href} className="font-medium hover:text-primary">
              {item.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </li>
        ))}
      </ul>
      {value.trim().length >= 2 && !message && found.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Ничего похожего не нашлось.</p>
      ) : null}
    </div>
  );
}
