import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { buildCourseChunks, buildCourseChunkDescriptors, expectedCourseIndexStamp, type CourseChunk } from "@/server/course-index";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, cosineSimilarity, embedText } from "@/server/embeddings";

const STAMP_ID = "__index_stamp__";

export type SearchHit = {
  id: string;
  kind: string;
  title: string;
  href: string;
  text: string;
  weekSlug: string | null;
  score: number;
};

export function rankChunks(query: string, chunks: CourseChunk[], limit = 20): SearchHit[] {
  const needle = query.trim();
  if (needle.length < 2) return [];
  const queryVector = embedText(needle);
  return chunks
    .map((chunk) => ({
      id: chunk.id,
      kind: chunk.kind,
      title: chunk.title,
      href: chunk.href,
      text: chunk.body.replaceAll("\n", " ").slice(0, 280),
      weekSlug: chunk.weekSlug,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
}

export function vectorLiteral(values: number[]) {
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`embedding dimensions must be ${EMBEDDING_DIMENSIONS}`);
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("embedding contains a non-finite value");
  }
  return Prisma.raw(`'[${values.join(",")}]'::vector`);
}

export function semanticSearchStatement(embedding: number[]) {
  const vector = vectorLiteral(embedding);
  return Prisma.sql`
    SELECT id, kind, title, href, body, "weekSlug",
           1 - (embedding <=> ${vector}) AS score
    FROM "CourseChunk"
    WHERE kind <> 'meta'
    ORDER BY embedding <=> ${vector}
    LIMIT 20
  `;
}

async function upsertChunk(
  tx: Prisma.TransactionClient,
  chunk: {
    id: string;
    kind: string;
    weekSlug: string | null;
    title: string;
    href: string;
    body: string;
    embedding: number[];
  }
) {
  const vector = vectorLiteral(chunk.embedding);
  await tx.$executeRaw`
    INSERT INTO "CourseChunk" (id, kind, "weekSlug", title, href, body, embedding, "updatedAt")
    VALUES (
      ${chunk.id},
      ${chunk.kind},
      ${chunk.weekSlug},
      ${chunk.title},
      ${chunk.href},
      ${chunk.body},
      ${vector},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      kind = EXCLUDED.kind,
      "weekSlug" = EXCLUDED."weekSlug",
      title = EXCLUDED.title,
      href = EXCLUDED.href,
      body = EXCLUDED.body,
      embedding = EXCLUDED.embedding,
      "updatedAt" = NOW()
  `;
}

export async function ensureCourseIndex() {
  const current = await prisma.courseChunk.findUnique({
    where: { id: STAMP_ID },
    select: { body: true },
  });
  const stamp = expectedCourseIndexStamp();
  if (current?.body === stamp) return stamp;
  const descriptors = buildCourseChunkDescriptors();
  if (descriptors.length === 0) throw new Error("course index is empty");
  const chunks = buildCourseChunks(descriptors);
  const zero = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  await prisma.$transaction(
    async (tx) => {
      for (const chunk of chunks) {
        await upsertChunk(tx, chunk);
      }
      await upsertChunk(tx, {
        id: STAMP_ID,
        kind: "meta",
        weekSlug: null,
        title: EMBEDDING_MODEL,
        href: "/search",
        body: stamp,
        embedding: zero,
      });
    },
    { timeout: 60_000 }
  );
  return stamp;
}

export async function searchCourse(query: string): Promise<{ ok: true; hits: SearchHit[] } | { ok: false; error: string; hits: [] }> {
  const needle = query.trim();
  if (needle.length < 2) return { ok: true, hits: [] };
  try {
    await ensureCourseIndex();
    const rows = await prisma.$queryRaw<
      { id: string; kind: string; title: string; href: string; body: string; weekSlug: string | null; score: number }[]
    >(semanticSearchStatement(embedText(needle)));
    return {
      ok: true,
      hits: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        title: row.title,
        href: row.href,
        text: row.body.replaceAll("\n", " ").slice(0, 280),
        weekSlug: row.weekSlug,
        score: Number(row.score),
      })),
    };
  } catch {
    return { ok: false, error: "Поиск по pgvector недоступен. Индекс курса не пустой, но база без расширения vector не отвечает.", hits: [] };
  }
}
