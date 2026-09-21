import { expect, test } from "@playwright/test";

test("register, learn, persist", async ({ page }) => {
  const email = `tester-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Имя").fill("Тестер");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("password12");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.getByRole("heading", { name: "Продолжить обучение" })).toBeVisible();

  await page.getByRole("link", { name: "Continue Learning" }).click();
  await expect(
    page.getByRole("heading", { name: "Окружение AI-разработчика и первый LLM API" })
  ).toBeVisible();

  await page.getByRole("tab", { name: "Теория" }).click();
  await expect(page.getByRole("heading", { name: "Архитектура AI-приложения" })).toBeVisible();
  await page.getByRole("button", { name: "В закладки" }).first().click();
  await expect(page.getByRole("button", { name: "В закладках" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Отметить, что прочитал" }).first().click();

  await page.getByRole("tab", { name: "Лаборатория" }).click();
  await page.getByPlaceholder("Заметки лаборатории").fill("Лаба в процессе");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Лаборатория сделана" }).click();

  await page.getByRole("tab", { name: "Практика" }).click();
  await page.getByPlaceholder("Черновик, выводы, ссылки").fill("Сделаю клиент");
  await page.getByRole("button", { name: "Hint 1" }).click();
  await expect(page.getByText("Подсказка 1")).toBeVisible();

  await page.getByRole("tab", { name: "Промпты" }).click();
  await expect(page.getByText("Ревью клиента")).toBeVisible();

  await page.getByRole("tab", { name: "Квиз" }).click();
  await expect(page.getByText("Проходной балл")).toBeVisible();

  await page.getByRole("tab", { name: "Артефакт" }).click();
  await page.getByPlaceholder("Ссылки, формулировки, чеклист текстом").fill("repo later");
  await page.getByRole("button", { name: /Артефакт готов/ }).click();

  await page.getByRole("link", { name: "Мой проект" }).click();
  await page.getByLabel("Название").fill("Office triage");
  await page.getByLabel("Название").blur();

  await page.getByRole("link", { name: "Справочник" }).click();
  await expect(page.getByRole("heading", { name: "Справочник" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "LLM" })).toBeVisible();

  await page.getByRole("link", { name: "Закладки" }).click();
  await expect(page.getByText("Архитектура AI-приложения")).toBeVisible();

  await page.getByRole("link", { name: "Поиск" }).click();
  await page.getByPlaceholder("Урок, термин, кусок теории").fill("RAG");
  await expect(page.getByRole("link", { name: "RAG" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Карта" }).click();
  await expect(page.getByRole("heading", { name: "Карта обучения" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Engineering" })).toBeVisible();

  const exportResponse = await page.request.get("/api/export");
  expect(exportResponse.ok()).toBeTruthy();
  const payload = await exportResponse.json();
  expect(payload.user.email).toBe(email);
  expect(payload.notes.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("password12");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Продолжить обучение" })).toBeVisible();
  await page.goto("/week/environment-llm-api");
  await expect(
    page.getByRole("heading", { name: "Окружение AI-разработчика и первый LLM API" })
  ).toBeVisible();
  await page.getByRole("tab", { name: "Лаборатория" }).click();
  await expect(page.getByPlaceholder("Заметки лаборатории")).toHaveValue("Лаба в процессе");
});
