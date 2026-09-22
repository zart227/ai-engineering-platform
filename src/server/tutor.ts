import type { ContentBlock, Lesson } from "@course/types";
import { getWeek } from "@course";
import { logError, logInfo, logWarn } from "@/server/logger";
import { rateLimit } from "@/server/rate-limit";
import { resolveTaskClient, type LlmClient, type LlmEnv } from "@/server/llm";

export const TUTOR_TASK = "tutor_v1" as const;
export const TUTOR_RATE_LIMIT = 20;
export const TUTOR_RATE_WINDOW_MS = 15 * 60 * 1000;
export const TUTOR_QUESTION_MAX = 2000;

export const TUTOR_SYSTEM_PROMPT = [
  "Ты тьютор одного урока на платформе.",
  "Отвечай только по учебному тексту этого урока и вопросу студента.",
  "Не добавляй решение практики, ответы квиза, ответы карточек «вспомни» и ответы блоков проверки.",
  "Можно объяснить следующий шаг своими словами, без готового решения.",
  "Не называй цены, суммы и тарифы, которых нет в учебном тексте.",
  "Если в учебном тексте нет ответа, так и скажи.",
].join("\n");

export type TutorSession = { user: { id: string } } | null;

export type TutorWeek = {
  slug: string;
  lessons: Lesson[];
  practice: { solution: string };
};

type TutorLog = (level: "info" | "warn" | "error", message: string, fields?: Record<string, unknown>) => void;

type TutorBody =
  | { ok: true; answer: string }
  | { ok: false; error: string };

export type TutorResponse = { status: number; body: TutorBody };

function blockLine(block: ContentBlock) {
  switch (block.type) {
    case "p":
    case "h":
    case "code":
    case "diagram":
      return block.text;
    case "ul":
    case "ol":
      return block.items.join("\n");
    case "callout":
    case "prompt":
      return `${block.title}\n${block.text}`;
    case "compare":
      return `${block.title}\n${block.bad}\n${block.good}`;
    case "reading":
      return block.items
        .map((item) => [item.title, item.note, item.url].filter(Boolean).join("\n"))
        .join("\n");
    case "check":
      return block.question;
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

export function lessonTeachingText(lesson: Lesson) {
  const lines = [lesson.title, ...lesson.objectives, ...lesson.blocks.map(blockLine)];
  return lines.filter((line) => line.trim().length > 0).join("\n\n");
}

export function buildTutorPrompt(lesson: Lesson, question: string) {
  const teaching = lessonTeachingText(lesson);
  return {
    system: TUTOR_SYSTEM_PROMPT,
    user: `Урок: ${lesson.title}\n\nУчебный текст:\n${teaching}\n\nВопрос студента:\n${question}`,
  };
}

export function replyContainsSolution(reply: string, solution: string) {
  const needle = solution.trim();
  if (!needle) return false;
  return reply.includes(needle);
}

function ownerId(session: TutorSession) {
  const id = session?.user?.id;
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.weekSlug !== "string" || typeof record.lessonId !== "string" || typeof record.question !== "string") {
    return null;
  }
  const weekSlug = record.weekSlug.trim();
  const lessonId = record.lessonId.trim();
  const question = record.question.trim();
  if (!weekSlug || !lessonId || !question || question.length > TUTOR_QUESTION_MAX) return null;
  return { weekSlug, lessonId, question };
}

function defaultLog(level: "info" | "warn" | "error", message: string, fields?: Record<string, unknown>) {
  if (level === "info") logInfo(message, fields);
  else if (level === "warn") logWarn(message, fields);
  else logError(message, fields);
}

function logFields(input: { userId: string; weekSlug?: string; lessonId?: string; provider?: "ollama" | "openai" }) {
  return {
    userId: input.userId,
    task: TUTOR_TASK,
    ...(input.weekSlug ? { weekSlug: input.weekSlug } : {}),
    ...(input.lessonId ? { lessonId: input.lessonId } : {}),
    ...(input.provider ? { provider: input.provider } : {}),
  };
}

export async function answerTutor(input: {
  session: TutorSession;
  body: unknown;
  env?: LlmEnv;
  clients?: { ollama?: LlmClient | null; openai?: LlmClient | null };
  loadWeek?: (slug: string) => TutorWeek | undefined;
  log?: TutorLog;
  limit?: (key: string, limit: number, windowMs: number) => { ok: boolean };
}): Promise<TutorResponse> {
  const log = input.log ?? defaultLog;
  const userId = ownerId(input.session);
  if (!userId) {
    return { status: 401, body: { ok: false, error: "unauthorized" } };
  }

  const parsed = parseBody(input.body);
  if (!parsed) {
    return { status: 400, body: { ok: false, error: "bad_request" } };
  }

  const week = (input.loadWeek ?? ((slug: string) => getWeek(slug)))(parsed.weekSlug);
  const lesson = week?.lessons.find((item) => item.id === parsed.lessonId);
  if (!week || !lesson) {
    return { status: 404, body: { ok: false, error: "not_found" } };
  }

  const resolved = resolveTaskClient(TUTOR_TASK, {
    env: input.env,
    clients: input.clients,
  });
  if (!resolved.ok) {
    log("warn", "tutor_not_configured", logFields({ userId, weekSlug: parsed.weekSlug, lessonId: parsed.lessonId }));
    return { status: 503, body: { ok: false, error: resolved.error } };
  }

  const limit = input.limit ?? rateLimit;
  if (!limit(`tutor:${userId}`, TUTOR_RATE_LIMIT, TUTOR_RATE_WINDOW_MS).ok) {
    log("warn", "tutor_rate_limited", logFields({ userId, weekSlug: parsed.weekSlug, lessonId: parsed.lessonId }));
    return { status: 429, body: { ok: false, error: "rate_limited" } };
  }

  const prompt = buildTutorPrompt(lesson, parsed.question);
  let reply: string;
  try {
    reply = await resolved.client.complete(prompt);
  } catch {
    log(
      "error",
      "tutor_provider_failed",
      logFields({ userId, weekSlug: parsed.weekSlug, lessonId: parsed.lessonId, provider: resolved.provider }),
    );
    return { status: 502, body: { ok: false, error: "provider_error" } };
  }

  if (replyContainsSolution(reply, week.practice.solution)) {
    log(
      "warn",
      "tutor_reply_rejected",
      logFields({ userId, weekSlug: parsed.weekSlug, lessonId: parsed.lessonId, provider: resolved.provider }),
    );
    return { status: 422, body: { ok: false, error: "reply_rejected" } };
  }

  log(
    "info",
    "tutor_answered",
    logFields({ userId, weekSlug: parsed.weekSlug, lessonId: parsed.lessonId, provider: resolved.provider }),
  );
  return { status: 200, body: { ok: true, answer: reply } };
}
