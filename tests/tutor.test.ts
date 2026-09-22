import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { Lesson } from "../course/types";
import {
  HEAVY_TASKS,
  OLLAMA_DEFAULT_MODEL,
  OPENAI_DEFAULT_MODEL,
  ROUTINE_TASKS,
  createOllamaClient,
  createOpenAIClient,
  providerForTask,
  resolveTaskClient,
  type FetchLike,
  type LlmClient,
} from "../src/server/llm";
import {
  TUTOR_QUESTION_MAX,
  TUTOR_RATE_LIMIT,
  TUTOR_SYSTEM_PROMPT,
  answerTutor,
  buildTutorPrompt,
  lessonTeachingText,
  type TutorSession,
} from "../src/server/tutor";

const SOLUTION = "PRACTICE-SOLUTION-TOKEN-9f3a";
const HINT = "NEXT-HINT-TOKEN-walk-the-input";
const QUIZ = "QUIZ-ANSWER-TOKEN-option-c";
const QUIZ_EXPLANATION = "QUIZ-EXPLANATION-TOKEN";
const RECALL = "RECALL-ANSWER-TOKEN";
const CHECK_QUESTION = "CHECK-QUESTION-TOKEN";
const CHECK_ANSWER = "CHECK-ANSWER-TOKEN";
const TEACHING = "TEACHING-TEXT-TOKEN embeddings map tokens to vectors.";
const OTHER_LESSON = "OTHER-LESSON-TOKEN";
const OTHER_WEEK = "OTHER-WEEK-TOKEN";
const QUESTION = "Почему вектор урока не равен решению?";
const EMAIL = "student@example.com";

const FORBIDDEN = [SOLUTION, HINT, QUIZ, QUIZ_EXPLANATION, RECALL, CHECK_ANSWER, OTHER_LESSON, OTHER_WEEK, EMAIL];

function mainLesson(): Lesson {
  return {
    id: "tutor-fixture-l1",
    title: "Вектор урока",
    minutes: 8,
    objectives: ["Отличить учебный текст от ключа ответа"],
    blocks: [
      { type: "p", text: TEACHING },
      { type: "h", text: "Заголовок урока" },
      { type: "ul", items: ["пункт списка"] },
      { type: "ol", items: ["шаг списка"] },
      { type: "callout", title: "Заметка", text: "короткая заметка" },
      { type: "prompt", title: "Промпт урока", text: "текст промпта урока" },
      { type: "compare", title: "Сравнение", bad: "плохой пример", good: "хороший пример" },
      { type: "code", language: "ts", text: "const lesson = true;" },
      { type: "diagram", text: "урок -> вопрос" },
      { type: "reading", items: [{ title: "Документация", url: "https://example.com/docs", note: "первоисточник" }] },
      { type: "check", question: CHECK_QUESTION, answer: CHECK_ANSWER },
    ],
  };
}

function fixtureWeek() {
  return {
    slug: "tutor-fixture-week",
    lessons: [
      mainLesson(),
      {
        id: "tutor-fixture-l2",
        title: "Другой урок",
        minutes: 5,
        objectives: [OTHER_LESSON],
        blocks: [{ type: "p", text: OTHER_LESSON } satisfies Lesson["blocks"][number]],
      },
    ],
    practice: {
      solution: SOLUTION,
      hints: [{ title: "Следующий шаг", text: HINT }],
    },
    quiz: {
      questions: [{ answer: 2, options: ["нет", "тоже нет", QUIZ], explanation: QUIZ_EXPLANATION }],
    },
    recall: [{ question: "чужой вопрос", answer: RECALL }],
    otherWeek: OTHER_WEEK,
  };
}

function session(): TutorSession {
  return { user: { id: "owner-1", email: EMAIL } } as TutorSession;
}

function mockClient(reply: string | Error, provider: "ollama" | "openai"): LlmClient & { calls: { system: string; user: string }[] } {
  const calls: { system: string; user: string }[] = [];
  return {
    provider,
    calls,
    async complete(input) {
      calls.push(input);
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
}

function ask(options: {
  reply?: string | Error;
  body?: unknown;
  session?: TutorSession;
  ollama?: ReturnType<typeof mockClient> | null;
  openai?: ReturnType<typeof mockClient> | null;
  log?: (level: "info" | "warn" | "error", message: string, fields?: Record<string, unknown>) => void;
  limit?: (key: string, limit: number, windowMs: number) => { ok: boolean };
}) {
  const week = fixtureWeek();
  const ollama = options.ollama === undefined ? mockClient(options.reply ?? HINT, "ollama") : options.ollama;
  const openai = options.openai === undefined ? mockClient("openai-should-not-run", "openai") : options.openai;
  return {
    week,
    ollama,
    openai,
    result: answerTutor({
      session: options.session === undefined ? session() : options.session,
      body: options.body === undefined
        ? { weekSlug: week.slug, lessonId: week.lessons[0].id, question: QUESTION }
        : options.body,
      clients: { ollama, openai },
      loadWeek: () => week,
      log: options.log,
      limit: options.limit,
    }),
  };
}

describe("tutor context", () => {
  it("sends the current lesson teaching text and question, and keeps the answer key out", () => {
    const week = fixtureWeek();
    const prompt = buildTutorPrompt(week.lessons[0], QUESTION);
    const blob = `${prompt.system}\n${prompt.user}`;
    assert.equal(blob.includes(TEACHING), true);
    assert.equal(blob.includes(CHECK_QUESTION), true);
    assert.equal(blob.includes(QUESTION), true);
    assert.equal(blob.includes("Отличить учебный текст от ключа ответа"), true);
    for (const secret of FORBIDDEN) {
      assert.equal(blob.includes(secret), false, secret);
    }
    assert.equal(lessonTeachingText(week.lessons[0]).includes(CHECK_ANSWER), false);
    assert.doesNotMatch(TUTOR_SYSTEM_PROMPT, /\$\d|\bUSD\b|руб/);
  });
});

describe("tutor route", () => {
  it("rejects a reply that contains the practice solution and accepts the next hint", async () => {
    const leaked = await ask({ reply: `Готовое решение: ${SOLUTION}` });
    const leakedResult = await leaked.result;
    assert.equal(leakedResult.status, 422);
    assert.deepEqual(leakedResult.body, { ok: false, error: "reply_rejected" });
    assert.equal(JSON.stringify(leakedResult.body).includes(SOLUTION), false);
    assert.equal(leaked.openai?.calls.length ?? 0, 0);

    const hinted = await ask({ reply: fixtureWeek().practice.hints[0].text });
    const hintedResult = await hinted.result;
    assert.equal(hintedResult.status, 200);
    assert.deepEqual(hintedResult.body, { ok: true, answer: HINT });
    assert.equal(hinted.openai?.calls.length ?? 0, 0);
    const sent = hinted.ollama?.calls[0];
    assert.ok(sent);
    assert.equal(`${sent.system}\n${sent.user}`.includes(SOLUTION), false);
    assert.equal(sent.user.includes(HINT), false);
    assert.equal(sent.user.includes(TEACHING), true);
  });

  it("requires a session owner and ignores a cookie string", async () => {
    const missing = await ask({ reply: HINT, session: null });
    const result = await missing.result;
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { ok: false, error: "unauthorized" });
    assert.equal(missing.ollama?.calls.length ?? 0, 0);

    const route = readFileSync("src/app/api/tutor/route.ts", "utf8");
    assert.match(route, /getSession\(/);
    assert.equal(route.includes("cookies("), false);
    assert.equal(route.includes("aep_session"), false);
  });

  it("does not call OpenAI when Ollama is unset", async () => {
    const openai = mockClient("should-not-run", "openai");
    const run = await ask({ ollama: null, openai });
    const result = await run.result;
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { ok: false, error: "ollama_not_configured" });
    assert.equal(openai.calls.length, 0);
  });

  it("rate-limits the owner and does not log the question, lesson, or email", async () => {
    const lines: string[] = [];
    const log = (level: "info" | "warn" | "error", message: string, fields?: Record<string, unknown>) => {
      lines.push(JSON.stringify({ level, message, fields }));
    };
    const userId = `tutor-owner-${Date.now()}`;
    const week = fixtureWeek();
    let calls = 0;
    const client: LlmClient = {
      provider: "ollama",
      async complete() {
        calls += 1;
        return HINT;
      },
    };
    for (let attempt = 0; attempt < TUTOR_RATE_LIMIT; attempt += 1) {
      const result = await answerTutor({
        session: { user: { id: userId } },
        body: { weekSlug: week.slug, lessonId: week.lessons[0].id, question: QUESTION },
        clients: { ollama: client, openai: null },
        loadWeek: () => week,
        log,
      });
      assert.equal(result.status, 200);
    }
    const blocked = await answerTutor({
      session: { user: { id: userId } },
      body: { weekSlug: week.slug, lessonId: week.lessons[0].id, question: QUESTION },
      clients: { ollama: client, openai: null },
      loadWeek: () => week,
      log,
    });
    assert.equal(blocked.status, 429);
    assert.deepEqual(blocked.body, { ok: false, error: "rate_limited" });
    assert.equal(calls, TUTOR_RATE_LIMIT);
    const text = lines.join("\n");
    assert.equal(text.includes(QUESTION), false);
    assert.equal(text.includes(TEACHING), false);
    assert.equal(text.includes(EMAIL), false);
    assert.equal(text.includes(SOLUTION), false);
    assert.match(text, /tutor_rate_limited/);
    assert.match(text, new RegExp(userId));
  });

  it("rejects an empty or oversized question before calling a client", async () => {
    const empty = await ask({ reply: HINT, body: { weekSlug: "tutor-fixture-week", lessonId: "tutor-fixture-l1", question: "  " } });
    assert.equal((await empty.result).status, 400);
    assert.equal(empty.ollama?.calls.length ?? 0, 0);

    const huge = await ask({
      reply: HINT,
      body: { weekSlug: "tutor-fixture-week", lessonId: "tutor-fixture-l1", question: "а".repeat(TUTOR_QUESTION_MAX + 1) },
    });
    assert.equal((await huge.result).status, 400);
  });

  it("does not call searchCourse or read feature-hash vectors", () => {
    const files = [
      "src/server/tutor.ts",
      "src/server/llm.ts",
      "src/app/api/tutor/route.ts",
      "src/components/lesson-tutor.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      assert.equal(source.includes("searchCourse"), false, file);
      assert.equal(source.includes("feature-hash"), false, file);
      assert.equal(source.includes("semantic-search"), false, file);
    }
    const ui = readFileSync("src/components/week-workspace.tsx", "utf8");
    const practice = ui.slice(ui.indexOf("function PracticePanel"), ui.indexOf("function ArtifactPanel"));
    const theory = ui.slice(ui.indexOf("function Theory"), ui.indexOf("function LabPanel"));
    assert.equal(practice.includes("LessonTutor"), false);
    assert.equal(practice.includes("Показать решение"), true);
    assert.equal(theory.includes("<LessonTutor"), true);
  });
});

describe("llm task router", () => {
  it("keeps job-pilot routine tasks on Ollama and heavy tasks on OpenAI", () => {
    const routine = ["filter", "scoring", "chat", "learning", "edit_proposal", "edit_reply", "tutor_v1"];
    const heavy = ["proposal", "rubric_feedback", "multi_week_context", "long_generation"];
    assert.deepEqual([...ROUTINE_TASKS], routine);
    assert.deepEqual([...HEAVY_TASKS], heavy);
    for (const task of routine) assert.equal(providerForTask(task), "ollama");
    for (const task of heavy) assert.equal(providerForTask(task), "openai");
    assert.equal(providerForTask("searchCourse"), null);
    assert.deepEqual(resolveTaskClient("not-a-task", { env: {} }), { ok: false, error: "unknown_task" });
  });

  it("fails closed per path and does not cross providers", () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error("live provider");
    };
    assert.deepEqual(
      resolveTaskClient("tutor_v1", { env: { OPENAI_API_KEY: "sk-test-openai" }, fetchImpl }),
      { ok: false, error: "ollama_not_configured" },
    );
    for (const task of ["proposal", "rubric_feedback", "multi_week_context", "long_generation"]) {
      assert.deepEqual(
        resolveTaskClient(task, { env: { OLLAMA_API_KEY: "ollama-test-key" }, fetchImpl }),
        { ok: false, error: "openai_not_configured" },
      );
    }
    assert.equal(createOllamaClient({}), null);
    assert.equal(createOpenAIClient({}), null);
    assert.equal(createOllamaClient({ OLLAMA_API_KEY: "ollama-test-key", OLLAMA_TIMEOUT_SECONDS: "0" }), null);
    assert.equal(createOpenAIClient({ OPENAI_API_KEY: "sk-test-openai", OPENAI_TIMEOUT_SECONDS: "-1" }), null);
  });

  it("builds the Ollama chat request and the OpenAI responses request from mocks", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith("/api/chat")) {
        return new Response(JSON.stringify({ message: { content: "ollama-ok" } }), { status: 200 });
      }
      return new Response(JSON.stringify({ output_text: "openai-ok" }), { status: 200 });
    };

    const ollama = createOllamaClient({ OLLAMA_API_KEY: "ollama-test-key", OLLAMA_BASE_URL: "https://ollama.com/" }, fetchImpl);
    assert.ok(ollama);
    assert.equal(await ollama.complete({ system: "system text", user: "user text" }), "ollama-ok");
    const ollamaBody = JSON.parse(String(calls[0].init.body));
    const ollamaHeaders = new Headers(calls[0].init.headers);
    assert.equal(calls[0].url, "https://ollama.com/api/chat");
    assert.equal(ollamaHeaders.get("authorization"), "Bearer ollama-test-key");
    assert.equal(ollamaBody.model, OLLAMA_DEFAULT_MODEL);
    assert.deepEqual(ollamaBody.messages, [
      { role: "system", content: "system text" },
      { role: "user", content: "user text" },
    ]);
    assert.deepEqual(ollamaBody.options, { temperature: 0.3 });
    assert.equal(ollamaBody.stream, false);

    const openai = createOpenAIClient({ OPENAI_API_KEY: "sk-test-openai" }, fetchImpl);
    assert.ok(openai);
    assert.equal(await openai.complete({ system: "instructions", user: "heavy input" }), "openai-ok");
    const openaiBody = JSON.parse(String(calls[1].init.body));
    const openaiHeaders = new Headers(calls[1].init.headers);
    assert.equal(calls[1].url, "https://api.openai.com/v1/responses");
    assert.equal(openaiHeaders.get("authorization"), "Bearer sk-test-openai");
    assert.equal(openaiBody.model, OPENAI_DEFAULT_MODEL);
    assert.equal(openaiBody.instructions, "instructions");
    assert.deepEqual(openaiBody.input, [{ role: "user", content: "heavy input" }]);
    assert.equal(openaiBody.temperature, 0.7);
    assert.equal("messages" in openaiBody, false);
    assert.equal(ollamaHeaders.has("cookie"), false);
  });

  it("reads OpenAI text from output content when output_text is absent", async () => {
    const fixture = JSON.parse(readFileSync("tests/fixtures/openai-response-output-text.json", "utf8")) as {
      status?: unknown;
      output_text?: unknown;
      output?: { content?: { type?: unknown; text?: unknown }[] }[];
    };
    assert.equal(fixture.status, "completed");
    assert.equal(fixture.output_text, undefined);
    assert.equal(fixture.output?.[0]?.content?.[0]?.type, "output_text");
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      calls.push(url);
      return new Response(JSON.stringify(fixture), { status: 200 });
    };
    const openai = createOpenAIClient({ OPENAI_API_KEY: "sk-test-openai" }, fetchImpl);
    assert.ok(openai);
    assert.equal(await openai.complete({ system: "instructions", user: "heavy input" }), "nested-openai-ok");
    assert.deepEqual(calls, ["https://api.openai.com/v1/responses"]);
  });

  it("keeps a top-level output_text string and rejects a non-output_text part", async () => {
    const preferred: FetchLike = async () =>
      new Response(JSON.stringify({
        output_text: "top-level-openai-ok",
        output: [{ content: [{ type: "output_text", text: "nested-should-lose" }] }],
      }), { status: 200 });
    const preferredClient = createOpenAIClient({ OPENAI_API_KEY: "sk-test-openai" }, preferred);
    assert.ok(preferredClient);
    assert.equal(await preferredClient.complete({ system: "s", user: "u" }), "top-level-openai-ok");

    const refused: FetchLike = async () =>
      new Response(JSON.stringify({
        status: "completed",
        output: [{ content: [{ type: "refusal", text: "hidden" }] }],
      }), { status: 200 });
    const refusedClient = createOpenAIClient({ OPENAI_API_KEY: "sk-test-openai" }, refused);
    assert.ok(refusedClient);
    await assert.rejects(
      () => refusedClient.complete({ system: "s", user: "u" }),
      (error: unknown) => error instanceof Error && error.message === "openai_empty",
    );
  });

  it("does not fall through to OpenAI when Ollama chat returns 402", async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      calls.push(url);
      return new Response("payment required", { status: 402 });
    };
    const resolved = resolveTaskClient("tutor_v1", {
      env: {
        OLLAMA_API_KEY: "ollama-test-key",
        OLLAMA_BASE_URL: "https://ollama.test",
        OPENAI_API_KEY: "sk-test-openai",
      },
      fetchImpl,
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.provider, "ollama");
    await assert.rejects(
      () => resolved.client.complete({ system: "s", user: "u" }),
      (error: unknown) => error instanceof Error && error.message === "ollama_http_402",
    );
    assert.deepEqual(calls, ["https://ollama.test/api/chat"]);
  });

  it("uses Ollama for tutor_v1 even when both clients are configured", async () => {
    const ollama = mockClient(HINT, "ollama");
    const openai = mockClient("heavy", "openai");
    const resolved = resolveTaskClient("tutor_v1", {
      env: { OLLAMA_API_KEY: "ollama-test-key", OPENAI_API_KEY: "sk-test-openai" },
      clients: { ollama, openai },
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.provider, "ollama");
    assert.equal(await resolved.client.complete({ system: "s", user: "u" }), HINT);
    assert.equal(openai.calls.length, 0);

    const heavy = resolveTaskClient("long_generation", { clients: { ollama, openai } });
    assert.equal(heavy.ok, true);
    if (!heavy.ok) return;
    assert.equal(heavy.provider, "openai");
    assert.equal(heavy.client, openai);
  });
});
