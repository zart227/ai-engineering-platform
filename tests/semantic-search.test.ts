import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCourseChunks } from "../src/server/course-index";
import { EMBEDDING_DIMENSIONS } from "../src/server/embeddings";
import { rankChunks, semanticSearchStatement } from "../src/server/semantic-search";

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
});
