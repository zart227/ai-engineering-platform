import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCourseChunks,
  buildCourseChunkDescriptors,
  courseIndexStamp,
  expectedCourseIndexStamp,
} from "../src/server/course-index";
import { prisma } from "../src/server/db";
import { EMBEDDING_DIMENSIONS } from "../src/server/embeddings";
import { ensureCourseIndex, rankChunks, semanticSearchStatement } from "../src/server/semantic-search";

describe("semantic course search", () => {
  it("indexes lessons and ranks a local-model query above an unrelated week", () => {
    const chunks = buildCourseChunks();
    assert.ok(chunks.length > 30);
    assert.ok(chunks.some((chunk) => chunk.id === "lesson:how-llms-work-l6"));
    const hits = rankChunks("квантованная модель на видеокарте", chunks, 8);
    assert.equal(hits[0]?.id, "glossary:quantization");
    assert.ok(hits.some((hit) => hit.id === "lesson:how-llms-work-l6"));
    assert.ok(!hits.some((hit) => hit.weekSlug === "n8n"));
  });

  it("asks pgvector for cosine distance", () => {
    const statement = semanticSearchStatement(new Array(EMBEDDING_DIMENSIONS).fill(0));
    const text = statement.strings.join(" ");
    assert.match(text, /<=>/);
    assert.match(text, /::vector/);
    assert.equal(statement.values.length, 0);
  });

  it("builds descriptors without embeddings and matches the full index stamp", () => {
    const descriptors = buildCourseChunkDescriptors();
    assert.ok(descriptors.length > 30);
    assert.equal(descriptors.every((descriptor) => descriptor.embedSource.length > 0), true);
    assert.equal(descriptors.some((descriptor) => "embedding" in descriptor), false);
    assert.equal(expectedCourseIndexStamp(descriptors), courseIndexStamp(buildCourseChunks(descriptors)));
  });

  it("short-circuits ensureCourseIndex when the stored stamp is current", async () => {
    const stamp = expectedCourseIndexStamp();
    const originalFindUnique = prisma.courseChunk.findUnique;
    const originalTransaction = prisma.$transaction;
    let transactionCalls = 0;
    prisma.courseChunk.findUnique = (async () => ({ body: stamp })) as unknown as typeof prisma.courseChunk.findUnique;
    prisma.$transaction = (async () => {
      transactionCalls += 1;
      throw new Error("ensureCourseIndex should not rebuild a warm index");
    }) as unknown as typeof prisma.$transaction;
    try {
      const result = await ensureCourseIndex();
      assert.equal(result, stamp);
      assert.equal(transactionCalls, 0);
    } finally {
      prisma.courseChunk.findUnique = originalFindUnique;
      prisma.$transaction = originalTransaction;
    }
  });

  it("rebuilds ensureCourseIndex when the stored stamp is stale", async () => {
    const stamp = expectedCourseIndexStamp();
    const originalFindUnique = prisma.courseChunk.findUnique;
    const originalTransaction = prisma.$transaction;
    let transactionCalls = 0;
    prisma.courseChunk.findUnique = (async () => ({ body: "stale-stamp" })) as unknown as typeof prisma.courseChunk.findUnique;
    prisma.$transaction = (async (callback: (tx: { $executeRaw: () => Promise<number> }) => Promise<void>) => {
      transactionCalls += 1;
      await callback({
        $executeRaw: async () => 1,
      });
    }) as unknown as typeof prisma.$transaction;
    try {
      const result = await ensureCourseIndex();
      assert.equal(result, stamp);
      assert.equal(transactionCalls, 1);
    } finally {
      prisma.courseChunk.findUnique = originalFindUnique;
      prisma.$transaction = originalTransaction;
    }
  });
});
