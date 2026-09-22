import { expect, test, type Page } from "@playwright/test";

const MCP_META = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
};

const WEEK1_QUIZ_ANSWERS = [
  "Только на сервере, в env, без попадания в бандл",
  "Backoff с jitter и уважать Retry-After, если он есть",
  "Нельзя учесть пользователя, бюджет, аудит и секреты в одном месте",
  "Сохранение входа до внешнего вызова и деградация UI",
  "model, latencyMs, promptTokens, requestId",
  "UI ждёт total и не отдаёт первый токен по TTFT",
  "Таймер первого токена стоит на закрытии тела, а не на первом delta",
  "Три: две паузы и успех",
];

const PRACTICE_DRAFT = "E2E practice draft with saved body";
const LAB_NOTE = "E2E lab note";
const ARTIFACT_GITHUB = "https://github.com/example/e2e-week1-artifact";
const ARTIFACT_NOTES = "E2E artifact checklist notes";

async function registerUser(page: Page, label: string) {
  const email = `e2e-${label}-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.locator("#auth-name").fill(`E2E ${label}`);
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("password12");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.getByRole("heading", { name: "Продолжить обучение" })).toBeVisible();
  return email;
}

async function loginUser(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("password12");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Продолжить обучение" })).toBeVisible();
}

async function openWeekOne(page: Page) {
  await page.getByRole("link", { name: "Продолжить" }).click();
  await expect(
    page.getByRole("heading", { name: "Окружение AI-разработчика и первый LLM API" })
  ).toBeVisible();
}

async function completeWeekOneLearning(page: Page) {
  await page.getByRole("tab", { name: "Теория" }).click();
  const readButtons = page.getByRole("button", { name: "Отметить, что прочитал" });
  const lessonCount = await readButtons.count();
  for (let index = 0; index < lessonCount; index += 1) {
    await readButtons.nth(index).click();
  }

  await page.getByRole("tab", { name: "Лаборатория" }).click();
  await page.getByPlaceholder("Заметки лаборатории").fill(LAB_NOTE);
  await expect(page.getByText("Сохранено")).toBeVisible();
  await page.getByRole("button", { name: "Лаборатория сделана" }).click();

  await page.getByRole("tab", { name: "Практика" }).click();
  await page.getByPlaceholder("Черновик, выводы, ссылки").fill(PRACTICE_DRAFT);
  await expect(page.getByText("Сохранено")).toBeVisible();
  await page.getByRole("button", { name: "Подсказка 1" }).click();
  await expect(page.getByText("Подсказка 1.")).toBeVisible();
  await page.getByRole("button", { name: "Практика сделана" }).click();

  await page.getByRole("tab", { name: "Квиз" }).click();
  for (const answer of WEEK1_QUIZ_ANSWERS) {
    await page.getByRole("radio", { name: answer }).check();
  }
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText(/Зачёт\./)).toBeVisible();

  await page.getByRole("tab", { name: "Артефакт" }).click();
  await page.getByPlaceholder("Ссылки, формулировки, чеклист текстом").fill(ARTIFACT_NOTES);
  await expect(page.getByText("Сохранено")).toBeVisible();
  await page.getByLabel("GitHub").fill(ARTIFACT_GITHUB);
  await page.getByLabel("GitHub").blur();
  await page.getByRole("button", { name: /Артефакт готов/ }).click();

  await expect(page.getByText("100%").first()).toBeVisible();
}

async function expectWeekOneState(page: Page) {
  await page.goto("/week/environment-llm-api");
  await expect(
    page.getByRole("heading", { name: "Окружение AI-разработчика и первый LLM API" })
  ).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();
  await page.getByRole("tab", { name: "Лаборатория" }).click();
  await expect(page.getByPlaceholder("Заметки лаборатории")).toHaveValue(LAB_NOTE);
  await page.getByRole("tab", { name: "Практика" }).click();
  await expect(page.getByPlaceholder("Черновик, выводы, ссылки")).toHaveValue(PRACTICE_DRAFT);
  await page.getByRole("tab", { name: "Артефакт" }).click();
  await expect(page.getByLabel("GitHub")).toHaveValue(ARTIFACT_GITHUB);
}

async function searchSmoke(page: Page) {
  await page.getByRole("link", { name: "Поиск" }).click();
  await page.getByPlaceholder("Урок, термин, кусок теории").fill("RAG");
  await expect(page.getByRole("link", { name: "RAG" }).first()).toBeVisible();
}

async function mcpSmoke(page: Page) {
  const listResponse = await page.request.post("/api/mcp", {
    data: {
      jsonrpc: "2.0",
      id: "e2e-list",
      method: "tools/list",
      params: { _meta: MCP_META },
    },
  });
  expect(listResponse.ok()).toBeTruthy();
  const listBody = (await listResponse.json()) as {
    result?: { tools?: { name: string }[] };
  };
  expect(listBody.result?.tools?.map((tool) => tool.name)).toEqual([
    "course.search",
    "course.lesson",
    "user.progress",
    "user.notes",
  ]);

  const searchResponse = await page.request.post("/api/mcp", {
    data: {
      jsonrpc: "2.0",
      id: "e2e-search",
      method: "tools/call",
      params: {
        name: "course.search",
        arguments: { query: "RAG" },
        _meta: MCP_META,
      },
    },
    headers: {
      "mcp-method": "tools/call",
      "mcp-name": "course.search",
      "mcp-protocol-version": "2026-07-28",
    },
  });
  expect(searchResponse.ok()).toBeTruthy();
  const searchBody = (await searchResponse.json()) as {
    result?: { isError?: boolean; content?: { text?: string }[] };
  };
  expect(searchBody.result?.isError).toBe(false);
  const payload = JSON.parse(searchBody.result?.content?.[0]?.text ?? "{}") as {
    hits?: { id: string }[];
  };
  expect(payload.hits?.length).toBeGreaterThan(0);

  const progressResponse = await page.request.post("/api/mcp", {
    data: {
      jsonrpc: "2.0",
      id: "e2e-progress",
      method: "tools/call",
      params: {
        name: "user.progress",
        arguments: { weekSlug: "environment-llm-api" },
        _meta: MCP_META,
      },
    },
    headers: {
      "mcp-method": "tools/call",
      "mcp-name": "user.progress",
      "mcp-protocol-version": "2026-07-28",
    },
  });
  expect(progressResponse.ok()).toBeTruthy();
  const progressBody = (await progressResponse.json()) as {
    result?: { isError?: boolean; content?: { text?: string }[] };
  };
  expect(progressBody.result?.isError).toBe(false);
  const progressPayload = JSON.parse(progressBody.result?.content?.[0]?.text ?? "{}") as {
    progress?: { weekSlug: string; percent: number }[];
  };
  const weekProgress = progressPayload.progress?.find((row) => row.weekSlug === "environment-llm-api");
  expect(weekProgress?.percent).toBe(100);
}

async function importExportSmoke(page: Page, exportPayload: unknown) {
  await page.getByRole("link", { name: "Настройки" }).click();
  await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "ai-engineering-platform-export.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exportPayload)),
  });
  await expect(page.getByRole("button", { name: "Импортировать" })).toBeVisible();
  await page.getByRole("button", { name: "Импортировать" }).click();
  await expect(page.getByText("Импорт готов")).toBeVisible();
}

test("golden learning flow with postgres persistence, search, mcp, and import restore", async ({
  page,
}) => {
  const primaryEmail = await registerUser(page, "primary");
  await openWeekOne(page);
  await completeWeekOneLearning(page);
  await searchSmoke(page);
  await mcpSmoke(page);

  const exportResponse = await page.request.get("/api/export");
  expect(exportResponse.ok()).toBeTruthy();
  const exportPayload = await exportResponse.json();
  expect(exportPayload.user.email).toBe(primaryEmail);
  expect(exportPayload.answers.length).toBeGreaterThan(0);
  expect(exportPayload.quizAttempts.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await loginUser(page, primaryEmail);
  await expectWeekOneState(page);

  await page.getByRole("button", { name: "Выйти" }).click();
  await registerUser(page, "restore");
  await importExportSmoke(page, exportPayload);
  await expectWeekOneState(page);
});
