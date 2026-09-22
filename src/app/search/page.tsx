import { SearchClient } from "./search-client";
import { searchCourse } from "@/server/semantic-search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const result = query.trim().length >= 2 ? await searchCourse(query) : { ok: true as const, hits: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl">Поиск</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Хеш-поиск по урокам и глоссарию. Модель {`feature-hash-v1`} кладёт векторы в pgvector. Другая формулировка без общих слов не находится.
      </p>
      <SearchClient key={query} query={query} hits={result.hits} error={result.ok ? "" : result.error} />
    </div>
  );
}