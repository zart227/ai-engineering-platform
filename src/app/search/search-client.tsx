"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export function SearchClient({
  items,
}: {
  items: { type: string; title: string; href: string; text: string }[];
}) {
  const [query, setQuery] = useState("");
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [items, query]);

  return (
    <div className="mt-6">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Урок, термин, кусок теории"
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
      />
      <ul className="mt-6 space-y-3">
        {found.map((item) => (
          <li key={`${item.href}-${item.title}`} className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">{item.type}</p>
            <Link href={item.href} className="font-medium hover:text-primary">
              {item.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
