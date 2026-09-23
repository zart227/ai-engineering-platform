import type { ContentBlock, Lesson } from "@course/types";
import { getWeek } from "@course";
import { logError, logInfo, logWarn } from "@/server/logger";
import { rateLimit } from "@/server/rate-limit";
import { resolveTaskClient, type LlmClient, type LlmEnv } from "@/server/llm";

export const TUTOR_TASK = "tutor_v1" as const;
export const TUTOR_RATE_LIMIT = 20;
export const TUTOR_RATE_WINDOW_MS = 15 * 60 * 1000;
export const TUTOR_QUESTION_MAX = 2000;

/** Minimum solution length so the substring/overlap guards are not vacuous. */
export const TUTOR_SECRET_MIN_CHARS = 40;
/** Contiguous normalized window used as a paraphrase-oriented leak signal. */
export const TUTOR_LEAK_WINDOW_CHARS = 48;
/** Fraction of content tokens from a secret that must appear in the reply to reject. */
export const TUTOR_TOKEN_OVERLAP_RATIO = 0.72;

/**
 * Limitation (H9): these guards catch exact and near-exact leaks (normalized
 * substring, long contiguous windows, high content-token overlap). They do not
 * catch synonym-only paraphrases with little lexical overlap. A full semantic
 * leak detector would need a judge model or embeddings; out of scope for V1.
 */
export const TUTOR_LEAK_DETECTOR_LIMITATION =
  "Conservative lexical guards only: exact/normalized containment, long contiguous windows, and high content-token overlap. Synonym-only paraphrases may pass.";

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
  practice: { solution: string; hints?: { title: string; text: string }[] };
  quiz?: {
    questions: { answer: number; options: string[]; explanation?: string }[];
  };
  recall?: { answer: string }[];
};

export type TutorLeakReason =
  | "solution"
  | "check_answer"
  | "quiz_key"
  | "recall_answer"
  | "out_of_scope_lesson";

export type TutorReplyEval = {
  ok: boolean;
  reasons: TutorLeakReason[];
  solutionAbsent: boolean;
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

export function normalizeTutorText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function contentTokens(normalized: string) {
  return normalized
    .split(/[^a-zа-яё0-9_-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function replyContainsNormalized(reply: string, secret: string) {
  const needle = normalizeTutorText(secret);
  if (!needle) return false;
  return normalizeTutorText(reply).includes(needle);
}

function replySharesLongWindow(reply: string, secret: string) {
  const normReply = normalizeTutorText(reply);
  const normSecret = normalizeTutorText(secret);
  if (normSecret.length < TUTOR_SECRET_MIN_CHARS) return false;
  const window = Math.min(TUTOR_LEAK_WINDOW_CHARS, Math.max(TUTOR_SECRET_MIN_CHARS, Math.floor(normSecret.length * 0.45)));
  if (normSecret.length < window) return false;
  for (let index = 0; index <= normSecret.length - window; index += 1) {
    if (normReply.includes(normSecret.slice(index, index + window))) return true;
  }
  return false;
}

function replySharesTokenOverlap(reply: string, secret: string) {
  const secretTokens = contentTokens(normalizeTutorText(secret));
  if (secretTokens.length < 6) return false;
  const replySet = new Set(contentTokens(normalizeTutorText(reply)));
  let hits = 0;
  for (const token of secretTokens) {
    if (replySet.has(token)) hits += 1;
  }
  return hits / secretTokens.length >= TUTOR_TOKEN_OVERLAP_RATIO;
}

const MIN_DISTINCTIVE_SECRET_CHARS = 16;

/** True when the reply appears to leak the secret via exact or paraphrase-oriented overlap. */
export function replyLeaksSecret(reply: string, secret: string) {
  const trimmed = secret.trim();
  if (!trimmed) return false;
  if (normalizeTutorText(trimmed).length < MIN_DISTINCTIVE_SECRET_CHARS) return false;
  return (
    replyContainsNormalized(reply, trimmed) ||
    replySharesLongWindow(reply, trimmed) ||
    replySharesTokenOverlap(reply, trimmed)
  );
}

export function solutionAbsent(reply: string, solution: string) {
  return !replyLeaksSecret(reply, solution);
}

/** Prefer solutionAbsent / replyLeaksSecret; kept for existing call sites. */
export function replyContainsSolution(reply: string, solution: string) {
  return replyLeaksSecret(reply, solution);
}

export function collectTutorForbiddenSecrets(
  week: TutorWeek,
  options: { outOfScopeTexts?: string[] } = {},
) {
  const solution = week.practice.solution.trim();
  const checkAnswers: string[] = [];
  const quizKeys: string[] = [];
  const recallAnswers: string[] = [];

  for (const lesson of week.lessons) {
    for (const block of lesson.blocks) {
      if (block.type === "check" && block.answer.trim()) {
        checkAnswers.push(block.answer.trim());
      }
    }
  }

  for (const question of week.quiz?.questions ?? []) {
    const option = question.options[question.answer];
    if (typeof option === "string" && option.trim()) quizKeys.push(option.trim());
    if (question.explanation?.trim()) quizKeys.push(question.explanation.trim());
  }

  for (const card of week.recall ?? []) {
    if (card.answer.trim()) recallAnswers.push(card.answer.trim());
  }

  return {
    solution,
    checkAnswers,
    quizKeys,
    recallAnswers,
    outOfScopeLesson: (options.outOfScopeTexts ?? []).map((text) => text.trim()).filter(Boolean),
  };
}

export function evaluateTutorReply(
  reply: string,
  week: TutorWeek,
  _lessonId: string,
  options: { outOfScopeTexts?: string[] } = {},
): TutorReplyEval {
  const secrets = collectTutorForbiddenSecrets(week, options);
  const reasons: TutorLeakReason[] = [];

  if (replyLeaksSecret(reply, secrets.solution)) reasons.push("solution");
  for (const answer of secrets.checkAnswers) {
    if (replyLeaksSecret(reply, answer)) {
      reasons.push("check_answer");
      break;
    }
  }
  for (const key of secrets.quizKeys) {
    if (replyLeaksSecret(reply, key)) {
      reasons.push("quiz_key");
      break;
    }
  }
  for (const answer of secrets.recallAnswers) {
    if (replyLeaksSecret(reply, answer)) {
      reasons.push("recall_answer");
      break;
    }
  }
  for (const text of secrets.outOfScopeLesson) {
    if (replyLeaksSecret(reply, text)) {
      reasons.push("out_of_scope_lesson");
      break;
    }
  }

  return {
    ok: reasons.length === 0,
    reasons,
    solutionAbsent: !reasons.includes("solution"),
  };
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

function asTutorWeek(week: ReturnType<typeof getWeek> | TutorWeek | undefined): TutorWeek | undefined {
  if (!week) return undefined;
  return {
    slug: week.slug,
    lessons: week.lessons,
    practice: { solution: week.practice.solution, hints: week.practice.hints },
    quiz: week.quiz
      ? {
          questions: week.quiz.questions.map((question) => ({
            answer: question.answer,
            options: question.options,
            explanation: question.explanation,
          })),
        }
      : undefined,
    recall: week.recall?.map((card) => ({ answer: card.answer })),
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

  const rawWeek = (input.loadWeek ?? ((slug: string) => asTutorWeek(getWeek(slug))))(parsed.weekSlug);
  const week = rawWeek ? asTutorWeek(rawWeek) : undefined;
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

  const evaluation = evaluateTutorReply(reply, week, parsed.lessonId);
  if (!evaluation.ok) {
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
