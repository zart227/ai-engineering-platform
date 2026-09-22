/**
 * Job-pilot splits calls by task, not by a fallback.
 *
 * Routine, `get_simple_llm_provider` (cloud Ollama): filter, scoring, chat,
 * learning, edit_proposal, edit_reply. Tutor V1 sits on this side.
 *
 * Heavy, `get_llm_provider` (OpenAI): proposal. Rubric feedback, multi-week
 * context, and long generation stay on this side. This module only names
 * them. It does not run those flows.
 */

export const ROUTINE_TASKS = [
  "filter",
  "scoring",
  "chat",
  "learning",
  "edit_proposal",
  "edit_reply",
  "tutor_v1",
] as const;

export const HEAVY_TASKS = [
  "proposal",
  "rubric_feedback",
  "multi_week_context",
  "long_generation",
] as const;

export type RoutineTask = (typeof ROUTINE_TASKS)[number];
export type HeavyTask = (typeof HEAVY_TASKS)[number];
export type LlmTask = RoutineTask | HeavyTask;

export const OLLAMA_DEFAULT_BASE_URL = "https://ollama.com";
export const OLLAMA_DEFAULT_MODEL = "minimax-m2.5";
export const OLLAMA_DEFAULT_TIMEOUT_SECONDS = 120;
export const OLLAMA_TEMPERATURE = 0.3;

export const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
export const OPENAI_DEFAULT_TIMEOUT_SECONDS = 30;
export const OPENAI_TEMPERATURE = 0.7;

export type LlmEnv = Record<string, string | undefined>;

export type LlmClient = {
  provider: "ollama" | "openai";
  complete(input: { system: string; user: string }): Promise<string>;
};

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type ResolveResult =
  | { ok: true; provider: "ollama" | "openai"; client: LlmClient }
  | { ok: false; error: "ollama_not_configured" | "openai_not_configured" | "unknown_task" };

export function providerForTask(task: string): "ollama" | "openai" | null {
  if ((ROUTINE_TASKS as readonly string[]).includes(task)) return "ollama";
  if ((HEAVY_TASKS as readonly string[]).includes(task)) return "openai";
  return null;
}

function requiredSecret(raw: string | undefined) {
  const value = raw?.trim() ?? "";
  return value.length > 0 ? value : null;
}

function readTimeout(raw: string | undefined, fallback: number) {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function ollamaHost(raw: string | undefined) {
  const host = (raw?.trim() || OLLAMA_DEFAULT_BASE_URL).replace(/\/$/, "");
  try {
    const url = new URL(host);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return host;
  } catch {
    return null;
  }
}

function textContent(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function openAIReplyText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { output_text?: unknown; output?: unknown };
  const top = textContent(record.output_text);
  if (top) return top;
  if (!Array.isArray(record.output) || record.output.length === 0) return null;
  const first = record.output[0];
  if (!first || typeof first !== "object") return null;
  const content = (first as { content?: unknown }).content;
  if (!Array.isArray(content) || content.length === 0) return null;
  const part = content[0];
  if (!part || typeof part !== "object") return null;
  const item = part as { type?: unknown; text?: unknown };
  if (item.type !== "output_text") return null;
  return textContent(item.text);
}

export function createOllamaClient(env: LlmEnv, fetchImpl: FetchLike = fetch): LlmClient | null {
  const apiKey = requiredSecret(env.OLLAMA_API_KEY);
  const host = ollamaHost(env.OLLAMA_BASE_URL);
  const timeoutSeconds = readTimeout(env.OLLAMA_TIMEOUT_SECONDS, OLLAMA_DEFAULT_TIMEOUT_SECONDS);
  const model = env.OLLAMA_MODEL?.trim() || OLLAMA_DEFAULT_MODEL;
  if (!apiKey || !host || timeoutSeconds === null || !model) return null;

  return {
    provider: "ollama",
    async complete({ system, user }) {
      const response = await fetchImpl(`${host}/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          options: { temperature: OLLAMA_TEMPERATURE },
          stream: false,
        }),
        signal: AbortSignal.timeout(timeoutSeconds * 1000),
      });
      if (!response.ok) {
        throw new Error(`ollama_http_${response.status}`);
      }
      const payload = (await response.json()) as { message?: { content?: unknown } };
      const content = textContent(payload.message?.content);
      if (!content) throw new Error("ollama_empty");
      return content;
    },
  };
}

export function createOpenAIClient(env: LlmEnv, fetchImpl: FetchLike = fetch): LlmClient | null {
  const apiKey = requiredSecret(env.OPENAI_API_KEY);
  const timeoutSeconds = readTimeout(env.OPENAI_TIMEOUT_SECONDS, OPENAI_DEFAULT_TIMEOUT_SECONDS);
  const model = env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;
  if (!apiKey || timeoutSeconds === null || !model) return null;

  return {
    provider: "openai",
    async complete({ system, user }) {
      const response = await fetchImpl("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: system,
          input: [{ role: "user", content: user }],
          temperature: OPENAI_TEMPERATURE,
        }),
        signal: AbortSignal.timeout(timeoutSeconds * 1000),
      });
      if (!response.ok) {
        throw new Error(`openai_http_${response.status}`);
      }
      const content = openAIReplyText(await response.json());
      if (!content) throw new Error("openai_empty");
      return content;
    },
  };
}

export function resolveTaskClient(
  task: string,
  options: {
    env?: LlmEnv;
    clients?: { ollama?: LlmClient | null; openai?: LlmClient | null };
    fetchImpl?: FetchLike;
  } = {},
): ResolveResult {
  const provider = providerForTask(task);
  if (!provider) return { ok: false, error: "unknown_task" };
  const env = options.env ?? process.env;
  if (provider === "ollama") {
    const injected = options.clients?.ollama;
    const client = injected !== undefined ? injected : createOllamaClient(env, options.fetchImpl ?? fetch);
    if (!client) return { ok: false, error: "ollama_not_configured" };
    return { ok: true, client, provider: "ollama" };
  }
  const injected = options.clients?.openai;
  const client = injected !== undefined ? injected : createOpenAIClient(env, options.fetchImpl ?? fetch);
  if (!client) return { ok: false, error: "openai_not_configured" };
  return { ok: true, client, provider: "openai" };
}
