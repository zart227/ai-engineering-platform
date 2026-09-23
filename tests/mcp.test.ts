import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getWeek, weeks } from "../course";
import { buildCourseChunks } from "../src/server/course-index";
import { handlePlatformMcp, MCP_PROTOCOL_VERSION, MCP_TOOLS } from "../src/server/mcp";
import { rankChunks } from "../src/server/semantic-search";

const PROTOCOL_META = "io.modelcontextprotocol/protocolVersion";
const CLIENT_CAPABILITIES = "io.modelcontextprotocol/clientCapabilities";
const SERVER_INFO = "io.modelcontextprotocol/serverInfo";

const meta = {
  [PROTOCOL_META]: MCP_PROTOCOL_VERSION,
  [CLIENT_CAPABILITIES]: {},
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
    result?: {
      resultType?: string;
      content?: { type?: string; text?: string }[];
      isError?: boolean;
      tools?: { name: string; inputSchema?: unknown; title?: string; description?: string }[];
      supportedVersions?: string[];
      capabilities?: { tools?: { listChanged?: boolean } };
      _meta?: Record<string, unknown>;
    };
    error?: { code?: number; message?: string };
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
    const searchTool = MCP_TOOLS.find((tool) => tool.name === "course.search");
    assert.match(searchTool?.description ?? "", /Хеш-поиск/);
    assert.doesNotMatch(searchTool?.description ?? "", /Семантический поиск/);
  });

  it("returns course search hits and a lesson for the session owner", async () => {
    const search = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.search",
        arguments: { query: "квантованная модель на видеокарте" },
      }),
      sessionUserId: "alice",
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
      sessionUserId: "alice",
    });
    const lessonBody = textOf(lesson);
    assert.equal(lessonBody.result?.isError, false);
    const lessonPayload = JSON.parse(lessonBody.result?.content?.[0]?.text ?? "{}") as {
      lesson: { lessonText: { trust: string; text: string } };
    };
    assert.equal(lessonPayload.lesson.lessonText.trust, "untrusted");
    assert.match(lessonPayload.lesson.lessonText.text, /Ollama/);
  });

  it("refuses course and user tools without a session and ignores a foreign user id", async () => {
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
    const anonymousNotes = await handlePlatformMcp({
      body: call("tools/call", { name: "user.notes", arguments: { userId: "bob" } }),
      sessionUserId: null,
      deps,
    });
    assert.equal(textOf(anonymousNotes).result?.isError, true);
    assert.match(textOf(anonymousNotes).result?.content?.[0]?.text ?? "", /сессия/);
    assert.equal(seen.length, 0);

    const anonymousSearch = await handlePlatformMcp({
      body: call("tools/call", { name: "course.search", arguments: { query: "ollama" } }),
      sessionUserId: null,
      deps,
    });
    assert.equal(textOf(anonymousSearch).result?.isError, true);
    assert.match(textOf(anonymousSearch).result?.content?.[0]?.text ?? "", /сессия/);

    const anonymousLesson = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.lesson",
        arguments: { weekSlug: "how-llms-work", lessonId: "how-llms-work-l6" },
      }),
      sessionUserId: null,
      deps,
    });
    assert.equal(textOf(anonymousLesson).result?.isError, true);
    assert.match(textOf(anonymousLesson).result?.content?.[0]?.text ?? "", /сессия/);

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
    const notesPayload = JSON.parse(textOf(notes).result?.content?.[0]?.text ?? "{}") as {
      notes: { noteBody: { trust: string; text: string } }[];
    };
    assert.equal(notesPayload.notes[0]?.noteBody.trust, "untrusted");
    assert.match(notesPayload.notes[0]?.noteBody.text ?? "", /только моя/);
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

describe("MCP 2026-07-28 wire conformance", () => {
  it("server/discover returns resultType, supportedVersions, tools capability, and serverInfo", async () => {
    const result = await handlePlatformMcp({
      body: call("server/discover"),
      sessionUserId: null,
    });
    assert.equal(result.status, 200);
    const body = textOf(result);
    assert.equal(body.result?.resultType, "complete");
    assert.deepEqual(body.result?.supportedVersions, [MCP_PROTOCOL_VERSION]);
    assert.equal(body.result?.capabilities?.tools?.listChanged, false);
    const serverInfo = body.result?._meta?.[SERVER_INFO] as { name?: string; version?: string } | undefined;
    assert.equal(serverInfo?.name, "ai-engineering-platform");
    assert.equal(serverInfo?.version, "0.2.0");
  });

  it("tools/list returns resultType complete and tool descriptors with inputSchema", async () => {
    const result = await handlePlatformMcp({
      body: call("tools/list"),
      sessionUserId: null,
    });
    assert.equal(result.status, 200);
    const body = textOf(result);
    assert.equal(body.result?.resultType, "complete");
    assert.equal(body.result?.tools?.length, 4);
    for (const tool of body.result?.tools ?? []) {
      assert.equal(typeof tool.name, "string");
      assert.equal(typeof tool.title, "string");
      assert.equal(typeof tool.description, "string");
      assert.equal((tool.inputSchema as { type?: string })?.type, "object");
    }
    const serverInfo = body.result?._meta?.[SERVER_INFO] as { name?: string } | undefined;
    assert.equal(serverInfo?.name, "ai-engineering-platform");
  });

  it("tools/call returns resultType complete with text content; execution failures use isError", async () => {
    const ok = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.lesson",
        arguments: { weekSlug: "mcp" },
      }),
      sessionUserId: "alice",
    });
    assert.equal(ok.status, 200);
    const okBody = textOf(ok);
    assert.equal(okBody.result?.resultType, "complete");
    assert.equal(okBody.result?.isError, false);
    assert.equal(okBody.result?.content?.[0]?.type, "text");
    assert.ok((okBody.result?.content?.[0]?.text ?? "").length > 0);

    const missingLesson = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.lesson",
        arguments: { weekSlug: "does-not-exist" },
      }),
      sessionUserId: "alice",
    });
    assert.equal(missingLesson.status, 200);
    const errBody = textOf(missingLesson);
    assert.equal(errBody.result?.resultType, "complete");
    assert.equal(errBody.result?.isError, true);
    assert.match(errBody.result?.content?.[0]?.text ?? "", /Урок не найден/);
    assert.equal(errBody.error, undefined);
  });

  it("protocol errors: missing _meta, unknown method, unknown tool name", async () => {
    const noMeta = await handlePlatformMcp({
      body: {
        jsonrpc: "2.0",
        id: "no-meta",
        method: "tools/list",
        params: {},
      },
      sessionUserId: null,
    });
    assert.equal(noMeta.status, 400);
    assert.equal(textOf(noMeta).error?.code, -32602);

    const unknownMethod = await handlePlatformMcp({
      body: call("resources/list"),
      sessionUserId: null,
    });
    assert.equal(unknownMethod.status, 404);
    assert.equal(textOf(unknownMethod).error?.code, -32601);

    const unknownTool = await handlePlatformMcp({
      body: call("tools/call", { name: "notes.write", arguments: {} }),
      sessionUserId: "alice",
    });
    assert.equal(unknownTool.status, 404);
    assert.equal(textOf(unknownTool).error?.code, -32601);
    assert.equal(textOf(unknownTool).result, undefined);
  });

  it("rejects non-object tool arguments with isError true, not a protocol error", async () => {
    const result = await handlePlatformMcp({
      body: call("tools/call", { name: "course.search", arguments: "not-an-object" }),
      sessionUserId: "alice",
    });
    assert.equal(result.status, 200);
    const body = textOf(result);
    assert.equal(body.result?.isError, true);
    assert.match(body.result?.content?.[0]?.text ?? "", /arguments/);
    assert.equal(body.error, undefined);
  });
});

describe("MCP course.lesson student-safe serializer", () => {
  it("includes non-text blocks and check.question without leaking check.answer", async () => {
    const week = getWeek("mcp");
    assert.ok(week);
    const lesson = week.lessons[0];
    assert.ok(lesson);
    const checkBlock = lesson.blocks.find((block) => block.type === "check");
    assert.ok(checkBlock && checkBlock.type === "check");

    const result = await handlePlatformMcp({
      body: call("tools/call", {
        name: "course.lesson",
        arguments: { weekSlug: "mcp", lessonId: lesson.id },
      }),
      sessionUserId: "alice",
    });
    const payload = JSON.parse(textOf(result).result?.content?.[0]?.text ?? "{}") as {
      lesson: { lessonText: { text: string; trust: string } };
    };
    const text = payload.lesson.lessonText.text;
    assert.equal(payload.lesson.lessonText.trust, "untrusted");
    assert.match(text, new RegExp(checkBlock.question.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(text.includes(checkBlock.answer), false);

    const hasList = lesson.blocks.some((block) => block.type === "ul" || block.type === "ol");
    if (hasList) {
      const listBlock = lesson.blocks.find((block) => block.type === "ul" || block.type === "ol");
      if (listBlock && (listBlock.type === "ul" || listBlock.type === "ol") && listBlock.items[0]) {
        assert.match(text, new RegExp(listBlock.items[0].slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }
  });

  it("never returns check.answer or practice.solution from live curriculum lessons", async () => {
    for (const week of weeks) {
      for (const lesson of week.lessons) {
        const hasHidden =
          lesson.blocks.some((block) => block.type === "check") || week.practice.solution.trim().length > 0;
        if (!hasHidden) continue;

        const result = await handlePlatformMcp({
          body: call("tools/call", {
            name: "course.lesson",
            arguments: { weekSlug: week.slug, lessonId: lesson.id },
          }),
          sessionUserId: "alice",
        });
        const raw = textOf(result).result?.content?.[0]?.text ?? "";
        assert.equal(textOf(result).result?.isError, false, `${lesson.id} should succeed`);

        for (const block of lesson.blocks) {
          if (block.type === "check") {
            assert.equal(raw.includes(block.answer), false, `${lesson.id} leaked check.answer`);
          }
        }
        if (week.practice.solution.trim()) {
          assert.equal(raw.includes(week.practice.solution), false, `${lesson.id} leaked practice.solution`);
        }
      }
    }
  });
});
