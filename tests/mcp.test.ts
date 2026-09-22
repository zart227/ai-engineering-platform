import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCourseChunks } from "../src/server/course-index";
import { handlePlatformMcp, MCP_TOOLS } from "../src/server/mcp";
import { rankChunks } from "../src/server/semantic-search";

const meta = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
};

function call(method: string, params: Record<string, unknown> = {}) {
  return {
    jsonrpc: "2.0" as const,
    id: "t1",
    method,
    params: { ...params, _meta: meta },
  };
}

function textOf(result: { body: unknown }) {
  const body = result.body as {
    result?: { content?: { text?: string }[]; isError?: boolean; tools?: { name: string }[] };
    error?: { code?: number };
  };
  return body;
}

describe("platform MCP", () => {
  it("lists the four course and user tools", async () => {
    const result = await handlePlatformMcp({
      body: call("tools/list"),
      sessionUserId: null,
    });
    const tools = textOf(result).result?.tools?.map((tool) => tool.name);
    assert.deepEqual(tools, MCP_TOOLS.map((tool) => tool.name));
    assert.deepEqual(tools, ["course.search", "course.lesson", "user.progress", "user.notes"]);
  });

  it("returns course search hits and a lesson", async () => {
    const search = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.search",
        arguments: { query: "квантованная модель на видеокарте" },
      }),
      sessionUserId: null,
      deps: {
        search: async (query) => rankChunks(query, buildCourseChunks(), 8),
        progress: async () => [],
        notes: async () => [],
      },
    });
    const searchBody = textOf(search);
    assert.equal(searchBody.result?.isError, false);
    const payload = JSON.parse(searchBody.result?.content?.[0]?.text ?? "{}") as { hits: { id: string }[] };
    assert.ok(payload.hits.some((hit) => hit.id === "lesson:how-llms-work-l6"));
    assert.equal(payload.hits[0]?.id, "glossary:quantization");

    const lesson = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.lesson",
        arguments: { weekSlug: "how-llms-work", lessonId: "how-llms-work-l6" },
      }),
      sessionUserId: null,
    });
    const lessonBody = textOf(lesson);
    assert.equal(lessonBody.result?.isError, false);
    assert.match(lessonBody.result?.content?.[0]?.text ?? "", /Ollama/);
  });

  it("refuses user tools without a session and ignores a foreign user id", async () => {
    const seen: string[] = [];
    const deps = {
      search: async () => [],
      progress: async (userId: string) => {
        seen.push(userId);
        return [{ weekSlug: "how-llms-work", percent: 40, completed: false }];
      },
      notes: async (userId: string) => {
        seen.push(userId);
        return [{ key: "n", body: "только моя", weekSlug: "how-llms-work", lessonId: null }];
      },
    };
    const anonymous = await handlePlatformMcp({
      body: call("tools/call", { name: "user.notes", arguments: { userId: "bob" } }),
      sessionUserId: null,
      deps,
    });
    assert.equal(textOf(anonymous).result?.isError, true);
    assert.match(textOf(anonymous).result?.content?.[0]?.text ?? "", /сессия/);
    assert.equal(seen.length, 0);

    const notes = await handlePlatformMcp({
      body: call("tools/call", { name: "user.notes", arguments: { userId: "bob", weekSlug: "how-llms-work" } }),
      sessionUserId: "alice",
      deps,
    });
    const progress = await handlePlatformMcp({
      body: call("tools/call", { name: "user.progress", arguments: { userId: "bob" } }),
      sessionUserId: "alice",
      deps,
    });
    assert.deepEqual(seen, ["alice", "alice"]);
    assert.match(textOf(notes).result?.content?.[0]?.text ?? "", /только моя/);
    assert.doesNotMatch(textOf(notes).result?.content?.[0]?.text ?? "", /bob/);
    assert.match(textOf(progress).result?.content?.[0]?.text ?? "", /alice/);
  });

  it("rejects a header that disagrees with the body and an unknown tool", async () => {
    const mismatch = await handlePlatformMcp({
      body: call("tools/call", { name: "course.lesson", arguments: { weekSlug: "mcp" } }),
      headers: { method: "tools/call", name: "user.notes", protocolVersion: "2026-07-28" },
      sessionUserId: "alice",
    });
    assert.equal(mismatch.status, 400);

    const missing = await handlePlatformMcp({
      body: call("tools/call", { name: "course.secret", arguments: {} }),
      sessionUserId: "alice",
    });
    assert.equal(missing.status, 404);
    assert.equal(textOf(missing).error?.code, -32601);
  });
});
