import { getWeek } from "@course";
import { buildCourseChunks } from "@/server/course-index";
import { wrapCourseLessonPayload, wrapUserNotesPayload } from "@/server/mcp-boundary";
import { serializeLessonBlocks } from "@/server/student-visible-course";
import { rankChunks, type SearchHit } from "@/server/semantic-search";

export const MCP_PROTOCOL_VERSION = "2026-07-28";

const PROTOCOL_META = "io.modelcontextprotocol/protocolVersion";
const CLIENT_CAPABILITIES = "io.modelcontextprotocol/clientCapabilities";
const SERVER_INFO = "io.modelcontextprotocol/serverInfo";

export const MCP_TOOLS = [
  {
    name: "course.search",
    title: "Поиск по курсу",
    description: "Хеш-поиск по урокам и глоссарию курса. Совпадение идёт по словам и префиксам feature-hash-v1, не по смыслу перефразировки. Аргумент query, не короче двух символов.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Фраза ученика" } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "course.lesson",
    title: "Урок курса",
    description: "Текст урока по weekSlug и необязательному lessonId. Чужие пользовательские данные не возвращает.",
    inputSchema: {
      type: "object",
      properties: {
        weekSlug: { type: "string" },
        lessonId: { type: "string" },
      },
      required: ["weekSlug"],
      additionalProperties: false,
    },
  },
  {
    name: "user.progress",
    title: "Прогресс владельца сессии",
    description: "Прогресс только аутентифицированного владельца сессии. Поле userId в аргументах игнорируется.",
    inputSchema: {
      type: "object",
      properties: { weekSlug: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "user.notes",
    title: "Заметки владельца сессии",
    description: "Заметки только аутентифицированного владельца сессии. Поле userId в аргументах игнорируется.",
    inputSchema: {
      type: "object",
      properties: { weekSlug: { type: "string" } },
      additionalProperties: false,
    },
  },
] as const;

export type McpProgressRow = {
  weekSlug: string;
  percent: number;
  completed: boolean;
};

export type McpNoteRow = {
  key: string;
  body: string;
  weekSlug: string | null;
  lessonId: string | null;
};

export type McpDeps = {
  search: (query: string) => Promise<SearchHit[]>;
  progress: (userId: string, weekSlug?: string) => Promise<McpProgressRow[]>;
  notes: (userId: string, weekSlug?: string) => Promise<McpNoteRow[]>;
};

type JsonRpc = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
};

function metaOf(params: unknown) {
  if (!params || typeof params !== "object") return null;
  const meta = (params as { _meta?: unknown })._meta;
  if (!meta || typeof meta !== "object") return null;
  return meta as Record<string, unknown>;
}

function toolResult(id: unknown, text: string, isError: boolean) {
  return {
    status: 200,
    body: {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        resultType: "complete",
        content: [{ type: "text", text }],
        isError,
        _meta: {
          [SERVER_INFO]: { name: "ai-engineering-platform", version: "0.2.0" },
        },
      },
    },
  };
}

function rpcError(id: unknown, code: number, message: string, status: number) {
  return {
    status,
    body: {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    },
  };
}

function requireMeta(params: unknown, id: unknown) {
  const meta = metaOf(params);
  if (!meta || meta[PROTOCOL_META] !== MCP_PROTOCOL_VERSION || meta[CLIENT_CAPABILITIES] === undefined) {
    return rpcError(id, -32602, "В params._meta нужны protocolVersion 2026-07-28 и clientCapabilities.", 400);
  }
  return null;
}

function lessonText(weekSlug: string, lessonId?: string) {
  const week = getWeek(weekSlug);
  if (!week) return null;
  const lesson = lessonId ? week.lessons.find((item) => item.id === lessonId) : week.lessons[0];
  if (!lesson) return null;
  // H1 student-safe serializer: theory + check.question; never check.answer / solutions.
  const text = serializeLessonBlocks(lesson.blocks);
  return { weekSlug: week.slug, title: week.title, lessonId: lesson.id, lessonTitle: lesson.title, text };
}

export function defaultMcpDeps(): McpDeps {
  return {
    search: async (query) => rankChunks(query, buildCourseChunks(), 8),
    progress: async () => [],
    notes: async () => [],
  };
}

export async function handlePlatformMcp(input: {
  body: unknown;
  headers?: { protocolVersion?: string | null; method?: string | null; name?: string | null };
  sessionUserId: string | null;
  deps?: McpDeps;
}) {
  const message = input.body as JsonRpc;
  const id = message && typeof message === "object" ? message.id : null;
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(id, -32600, "Ожидается JSON-RPC 2.0.", 400);
  }
  const headers = input.headers;
  if (headers?.protocolVersion && headers.protocolVersion !== MCP_PROTOCOL_VERSION) {
    return rpcError(id, -32600, "MCP-Protocol-Version не совпал с 2026-07-28.", 400);
  }
  if (headers?.method && headers.method !== message.method) {
    return rpcError(id, -32600, "Mcp-Method не совпал с method.", 400);
  }
  const metaError = requireMeta(message.params, id);
  if (metaError) return metaError;

  const deps = input.deps ?? defaultMcpDeps();
  const params = (message.params ?? {}) as Record<string, unknown>;

  if (message.method === "server/discover") {
    return {
      status: 200,
      body: {
        jsonrpc: "2.0",
        id,
        result: {
          resultType: "complete",
          supportedVersions: [MCP_PROTOCOL_VERSION],
          capabilities: { tools: { listChanged: false } },
          _meta: {
            [SERVER_INFO]: { name: "ai-engineering-platform", version: "0.2.0" },
          },
        },
      },
    };
  }

  if (message.method === "tools/list") {
    return {
      status: 200,
      body: {
        jsonrpc: "2.0",
        id,
        result: {
          resultType: "complete",
          tools: MCP_TOOLS.map((tool) => ({ ...tool })),
          _meta: {
            [SERVER_INFO]: { name: "ai-engineering-platform", version: "0.2.0" },
          },
        },
      },
    };
  }

  if (message.method !== "tools/call") {
    return rpcError(id, -32601, "Метод не реализован.", 404);
  }

  const name = typeof params.name === "string" ? params.name : "";
  if (headers?.name && headers.name !== name) {
    return rpcError(id, -32600, "Mcp-Name не совпал с params.name.", 400);
  }
  const known = MCP_TOOLS.some((tool) => tool.name === name);
  if (!known) return rpcError(id, -32601, "Инструмент не найден.", 404);
  const args = params.arguments;
  if (args !== undefined && (typeof args !== "object" || args === null || Array.isArray(args))) {
    return toolResult(id, "arguments должен быть объектом.", true);
  }
  const argumentsObject = (args ?? {}) as Record<string, unknown>;

  try {
    return await callTool(id, name, argumentsObject, input.sessionUserId, deps);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Инструмент не выполнился.";
    return toolResult(id, message, true);
  }
}

async function callTool(
  id: unknown,
  name: string,
  argumentsObject: Record<string, unknown>,
  sessionUserId: string | null,
  deps: McpDeps
) {
  if (!sessionUserId) {
    return toolResult(id, "Нужна сессия владельца. Наличие cookie без проверки сессии недостаточно.", true);
  }

  if (name === "course.search") {
    const query = typeof argumentsObject.query === "string" ? argumentsObject.query : "";
    if (query.trim().length < 2) return toolResult(id, "Нужна фраза query не короче двух символов.", true);
    const hits = await deps.search(query);
    return toolResult(id, JSON.stringify({ query, hits }), false);
  }

  if (name === "course.lesson") {
    const weekSlug = typeof argumentsObject.weekSlug === "string" ? argumentsObject.weekSlug : "";
    const lessonId = typeof argumentsObject.lessonId === "string" ? argumentsObject.lessonId : undefined;
    const lesson = lessonText(weekSlug, lessonId);
    if (!lesson) return toolResult(id, "Урок не найден.", true);
    return toolResult(id, JSON.stringify(wrapCourseLessonPayload(lesson)), false);
  }

  const weekSlug = typeof argumentsObject.weekSlug === "string" ? argumentsObject.weekSlug : undefined;
  if (name === "user.progress") {
    const rows = await deps.progress(sessionUserId, weekSlug);
    return toolResult(id, JSON.stringify({ userId: sessionUserId, progress: rows }), false);
  }
  const notes = await deps.notes(sessionUserId, weekSlug);
  const wrapped = wrapUserNotesPayload(notes);
  return toolResult(id, JSON.stringify({ userId: sessionUserId, ...wrapped }), false);
}
