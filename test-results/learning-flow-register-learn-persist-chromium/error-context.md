# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-flow.spec.ts >> register, learn, persist
- Location: e2e/learning-flow.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Продолжить обучение')
Expected: visible
Error: strict mode violation: getByText('Продолжить обучение') resolved to 2 elements:
    1) <h1 class="mt-3 font-heading text-4xl tracking-tight">Продолжить обучение</h1> aka getByRole('heading', { name: 'Продолжить обучение' })
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__">Продолжить обучение</div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toBeVisible" getByText('Продолжить обучение') with timeout 5000ms
  - waiting for getByText('Продолжить обучение')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "AI Engineering Platform 32 недели" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]: AI Engineering Platform
        - generic [ref=e6]: 32 недели
      - navigation [ref=e7]:
        - link "Курс" [ref=e8] [cursor=pointer]:
          - /url: /
        - link "Карта" [ref=e9] [cursor=pointer]:
          - /url: /map
        - link "Мой проект" [ref=e10] [cursor=pointer]:
          - /url: /project
        - link "Проекты" [ref=e11] [cursor=pointer]:
          - /url: /projects
        - link "Заметки" [ref=e12] [cursor=pointer]:
          - /url: /notes
        - link "Справочник" [ref=e13] [cursor=pointer]:
          - /url: /glossary
        - link "Поиск" [ref=e14] [cursor=pointer]:
          - /url: /search
        - link "Настройки" [ref=e15] [cursor=pointer]:
          - /url: /settings
      - generic [ref=e16]:
        - generic [ref=e17]: 0%
        - button "Тема" [ref=e20]
        - button "Выйти" [ref=e22]
  - main [ref=e23]:
    - generic [ref=e24]:
      - paragraph [ref=e25]: Прогресс курса · 0%
      - heading "Продолжить обучение" [level=1] [ref=e26]
      - paragraph [ref=e27]: "Сейчас: AI Fundamentals. Неделя 1. LLM API."
      - generic [ref=e28]:
        - link "Continue Learning" [ref=e29] [cursor=pointer]:
          - /url: /week/environment-llm-api
        - link "Журнал проекта" [ref=e30] [cursor=pointer]:
          - /url: /project
      - generic [ref=e31]:
        - generic [ref=e32]:
          - paragraph [ref=e33]: Уроки
          - paragraph [ref=e34]: 0/105
        - generic [ref=e35]:
          - paragraph [ref=e36]: Лабы
          - paragraph [ref=e37]: 0/33
        - generic [ref=e38]:
          - paragraph [ref=e39]: Артефакты
          - paragraph [ref=e40]: 0/33
        - generic [ref=e41]:
          - paragraph [ref=e42]: Проекты
          - paragraph [ref=e43]: "0"
      - generic [ref=e44]:
        - generic [ref=e45]:
          - heading "AI Fundamentals" [level=2] [ref=e46]
          - paragraph [ref=e47]: "Окружение, API, устройство моделей, промпты, контекст и structured output. Первый проект: LLM Playground."
          - generic [ref=e48]:
            - link "Неделя 1 0% LLM API Собрать рабочее окружение, спрятать секреты, отправить первый устойчивый запрос к модели и понять, сколько это стоит." [ref=e49] [cursor=pointer]:
              - /url: /week/environment-llm-api
              - generic [ref=e50]:
                - generic [ref=e51]: Неделя 1
                - generic [ref=e52]: 0%
              - paragraph [ref=e53]: LLM API
              - paragraph [ref=e54]: Собрать рабочее окружение, спрятать секреты, отправить первый устойчивый запрос к модели и понять, сколько это стоит.
            - link "Неделя 2 0% Как устроены LLM Понять токены, контекст, sampling и галлюцинации настолько, чтобы выбирать параметры и не одушевлять модель." [ref=e56] [cursor=pointer]:
              - /url: /week/how-llms-work
              - generic [ref=e57]:
                - generic [ref=e58]: Неделя 2
                - generic [ref=e59]: 0%
              - paragraph [ref=e60]: Как устроены LLM
              - paragraph [ref=e61]: Понять токены, контекст, sampling и галлюцинации настолько, чтобы выбирать параметры и не одушевлять модель.
            - link "Неделя 3 0% Промпты Сделать промпт версионируемым артефактом с шаблоном, примерами и оценкой, а не перепиской в чате." [ref=e63] [cursor=pointer]:
              - /url: /week/prompt-engineering
              - generic [ref=e64]:
                - generic [ref=e65]: Неделя 3
                - generic [ref=e66]: 0%
              - paragraph [ref=e67]: Промпты
              - paragraph [ref=e68]: Сделать промпт версионируемым артефактом с шаблоном, примерами и оценкой, а не перепиской в чате.
            - link "Неделя 4 0% Контекст и JSON Собрать контекст как бюджет и заставить модель отвечать по схеме с валидацией и ремонтом." [ref=e70] [cursor=pointer]:
              - /url: /week/context-structured-output
              - generic [ref=e71]:
                - generic [ref=e72]: Неделя 4
                - generic [ref=e73]: 0%
              - paragraph [ref=e74]: Контекст и JSON
              - paragraph [ref=e75]: Собрать контекст как бюджет и заставить модель отвечать по схеме с валидацией и ремонтом.
        - generic [ref=e77]:
          - heading "AI-Assisted Software Engineering" [level=2] [ref=e78]
          - paragraph [ref=e79]: "Профессиональная работа с coding agents: спецификация, план, ревью, тесты, безопасность."
          - generic [ref=e80]:
            - link "Неделя 5 0% AI-coding Провести фичу через specification-driven workflow, а не через «напиши код»." [ref=e81] [cursor=pointer]:
              - /url: /week/professional-ai-coding
              - generic [ref=e82]:
                - generic [ref=e83]: Неделя 5
                - generic [ref=e84]: 0%
              - paragraph [ref=e85]: AI-coding
              - paragraph [ref=e86]: Провести фичу через specification-driven workflow, а не через «напиши код».
            - link "Неделя 6 0% Debug & review Встроить гипотезы, тесты и security review в работу с агентом." [ref=e88] [cursor=pointer]:
              - /url: /week/ai-debug-test-review
              - generic [ref=e89]:
                - generic [ref=e90]: Неделя 6
                - generic [ref=e91]: 0%
              - paragraph [ref=e92]: Debug & review
              - paragraph [ref=e93]: Встроить гипотезы, тесты и security review в работу с агентом.
        - generic [ref=e95]:
          - heading "Automation Engineering" [level=2] [ref=e96]
          - paragraph [ref=e97]: "Скрипты, n8n, API, webhooks и AI внутри детерминированных пайплайнов. Проект: AI Office Automation."
          - generic [ref=e98]:
            - link "Неделя 7 0% Автоматизация Отличить script, workflow, AI workflow и agent и выбрать более надёжное." [ref=e99] [cursor=pointer]:
              - /url: /week/automation-fundamentals
              - generic [ref=e100]:
                - generic [ref=e101]: Неделя 7
                - generic [ref=e102]: 0%
              - paragraph [ref=e103]: Автоматизация
              - paragraph [ref=e104]: Отличить script, workflow, AI workflow и agent и выбрать более надёжное.
            - link "Неделя 8 0% n8n Собрать workflow с ветками, webhook и error path и знать, когда n8n хуже кода." [ref=e106] [cursor=pointer]:
              - /url: /week/n8n
              - generic [ref=e107]:
                - generic [ref=e108]: Неделя 8
                - generic [ref=e109]: 0%
              - paragraph [ref=e110]: n8n
              - paragraph [ref=e111]: Собрать workflow с ветками, webhook и error path и знать, когда n8n хуже кода.
            - link "Неделя 9 0% API и webhooks Сделать приём webhook с подписью, ретраями и идемпотентностью." [ref=e113] [cursor=pointer]:
              - /url: /week/apis-webhooks
              - generic [ref=e114]:
                - generic [ref=e115]: Неделя 9
                - generic [ref=e116]: 0%
              - paragraph [ref=e117]: API и webhooks
              - paragraph [ref=e118]: Сделать приём webhook с подписью, ретраями и идемпотентностью.
            - 'link "Неделя 10 0% AI automation Собрать пайплайн: событие → классификация → extraction → маршрут → запись → уведомление." [ref=e120] [cursor=pointer]':
              - /url: /week/ai-automation
              - generic [ref=e121]:
                - generic [ref=e122]: Неделя 10
                - generic [ref=e123]: 0%
              - paragraph [ref=e124]: AI automation
              - paragraph [ref=e125]: "Собрать пайплайн: событие → классификация → extraction → маршрут → запись → уведомление."
        - generic [ref=e127]:
          - heading "Tools & Agents" [level=2] [ref=e128]
          - paragraph [ref=e129]: "Tool calling и цикл агента с нуля, без фреймворка. Проект: Personal AI Agent."
          - generic [ref=e130]:
            - link "Неделя 11 0% Tools Модель выбирает инструмент, ваш код исполняет, схема и права ваши." [ref=e131] [cursor=pointer]:
              - /url: /week/tool-calling
              - generic [ref=e132]:
                - generic [ref=e133]: Неделя 11
                - generic [ref=e134]: 0%
              - paragraph [ref=e135]: Tools
              - paragraph [ref=e136]: Модель выбирает инструмент, ваш код исполняет, схема и права ваши.
            - link "Неделя 12 0% Agent loop Написать Goal → LLM → Decision → Tool → Observation → State → Next без фреймворка." [ref=e138] [cursor=pointer]:
              - /url: /week/agent-loop
              - generic [ref=e139]:
                - generic [ref=e140]: Неделя 12
                - generic [ref=e141]: 0%
              - paragraph [ref=e142]: Agent loop
              - paragraph [ref=e143]: Написать Goal → LLM → Decision → Tool → Observation → State → Next без фреймворка.
        - generic [ref=e145]:
          - heading "Embeddings & RAG" [level=2] [ref=e146]
          - paragraph [ref=e147]: "Векторы, pgvector, RAG и advanced retrieval. Проект: AI Knowledge Platform."
          - generic [ref=e148]:
            - link "Неделя 13 0% Embeddings Посчитать cosine, понять ложные соседи, не прятать поиск за SaaS." [ref=e149] [cursor=pointer]:
              - /url: /week/embeddings
              - generic [ref=e150]:
                - generic [ref=e151]: Неделя 13
                - generic [ref=e152]: 0%
              - paragraph [ref=e153]: Embeddings
              - paragraph [ref=e154]: Посчитать cosine, понять ложные соседи, не прятать поиск за SaaS.
            - link "Неделя 14 0% pgvector Хранить векторы рядом с реляционными данными и фильтровать по metadata." [ref=e156] [cursor=pointer]:
              - /url: /week/pgvector
              - generic [ref=e157]:
                - generic [ref=e158]: Неделя 14
                - generic [ref=e159]: 0%
              - paragraph [ref=e160]: pgvector
              - paragraph [ref=e161]: Хранить векторы рядом с реляционными данными и фильтровать по metadata.
            - link "Неделя 15 0% RAG Documents → chunk → embed → retrieve → context → LLM → ответ с citations." [ref=e163] [cursor=pointer]:
              - /url: /week/rag
              - generic [ref=e164]:
                - generic [ref=e165]: Неделя 15
                - generic [ref=e166]: 0%
              - paragraph [ref=e167]: RAG
              - paragraph [ref=e168]: Documents → chunk → embed → retrieve → context → LLM → ответ с citations.
            - link "Неделя 16 0% Advanced RAG Hybrid search, rewrite, rerank, eval hit-rate. Проект Knowledge Platform." [ref=e170] [cursor=pointer]:
              - /url: /week/advanced-rag
              - generic [ref=e171]:
                - generic [ref=e172]: Неделя 16
                - generic [ref=e173]: 0%
              - paragraph [ref=e174]: Advanced RAG
              - paragraph [ref=e175]: Hybrid search, rewrite, rerank, eval hit-rate. Проект Knowledge Platform.
        - generic [ref=e177]:
          - heading "Memory" [level=2] [ref=e178]
          - paragraph [ref=e179]: Рабочая, эпизодическая и семантическая память агента, забвение и приватность.
          - link "Неделя 17 0% Memory Добавить persistent memory с типами, забвением и приватностью." [ref=e181] [cursor=pointer]:
            - /url: /week/agent-memory
            - generic [ref=e182]:
              - generic [ref=e183]: Неделя 17
              - generic [ref=e184]: 0%
            - paragraph [ref=e185]: Memory
            - paragraph [ref=e186]: Добавить persistent memory с типами, забвением и приватностью.
        - generic [ref=e188]:
          - heading "MCP" [level=2] [ref=e189]
          - paragraph [ref=e190]: "Model Context Protocol: свой сервер на TypeScript по актуальной спецификации."
          - link "Неделя 18 0% MCP Свой MCP server на TypeScript по актуальной спецификации." [ref=e192] [cursor=pointer]:
            - /url: /week/mcp
            - generic [ref=e193]:
              - generic [ref=e194]: Неделя 18
              - generic [ref=e195]: 0%
            - paragraph [ref=e196]: MCP
            - paragraph [ref=e197]: Свой MCP server на TypeScript по актуальной спецификации.
        - generic [ref=e199]:
          - heading "Agent Frameworks" [level=2] [ref=e200]
          - paragraph [ref=e201]: Что SDK делает за вас. Портирование своего цикла на один актуальный runtime.
          - link "Неделя 19 0% Frameworks Понять, что фреймворк делает за вас, и портировать свой цикл на один SDK." [ref=e203] [cursor=pointer]:
            - /url: /week/agent-frameworks
            - generic [ref=e204]:
              - generic [ref=e205]: Неделя 19
              - generic [ref=e206]: 0%
            - paragraph [ref=e207]: Frameworks
            - paragraph [ref=e208]: Понять, что фреймворк делает за вас, и портировать свой цикл на один SDK.
        - generic [ref=e210]:
          - heading "Multi-Agent Systems" [level=2] [ref=e211]
          - paragraph [ref=e212]: Паттерны координации и Deep Research System с фактчеком.
          - generic [ref=e213]:
            - link "Неделя 20 0% Multi-agent Паттерны координации и цена ошибок каскада." [ref=e214] [cursor=pointer]:
              - /url: /week/multi-agent-fundamentals
              - generic [ref=e215]:
                - generic [ref=e216]: Неделя 20
                - generic [ref=e217]: 0%
              - paragraph [ref=e218]: Multi-agent
              - paragraph [ref=e219]: Паттерны координации и цена ошибок каскада.
            - link "Неделя 21 0% Deep Research Supervisor + specialists + fact checker + critic. Цитаты, trace, cost." [ref=e221] [cursor=pointer]:
              - /url: /week/multi-agent-architecture
              - generic [ref=e222]:
                - generic [ref=e223]: Неделя 21
                - generic [ref=e224]: 0%
              - paragraph [ref=e225]: Deep Research
              - paragraph [ref=e226]: Supervisor + specialists + fact checker + critic. Цитаты, trace, cost.
        - generic [ref=e228]:
          - heading "Planning" [level=2] [ref=e229]
          - paragraph [ref=e230]: Декомпозиция цели, DAG, checkpoints и перепланирование.
          - link "Неделя 22 0% Planning Декомпозиция цели в DAG, checkpoint, перепланирование при срыве." [ref=e232] [cursor=pointer]:
            - /url: /week/planning
            - generic [ref=e233]:
              - generic [ref=e234]: Неделя 22
              - generic [ref=e235]: 0%
            - paragraph [ref=e236]: Planning
            - paragraph [ref=e237]: Декомпозиция цели в DAG, checkpoint, перепланирование при срыве.
        - generic [ref=e239]:
          - heading "Human-in-the-loop" [level=2] [ref=e240]
          - paragraph [ref=e241]: Approve, pause, permissions, audit. Опасные действия не проходят без человека.
          - link "Неделя 23 0% HITL Approve, pause/resume, permissions, audit для опасных действий." [ref=e243] [cursor=pointer]:
            - /url: /week/human-in-the-loop
            - generic [ref=e244]:
              - generic [ref=e245]: Неделя 23
              - generic [ref=e246]: 0%
            - paragraph [ref=e247]: HITL
            - paragraph [ref=e248]: Approve, pause/resume, permissions, audit для опасных действий.
        - generic [ref=e250]:
          - heading "AI Security" [level=2] [ref=e251]
          - paragraph [ref=e252]: Injection, tool poisoning, exfiltration. Атаковать своего агента, затем защитить.
          - link "Неделя 24 0% Security Пять атак на своего агента в локальной песочнице, затем защиты и регресс-тесты." [ref=e254] [cursor=pointer]:
            - /url: /week/ai-security
            - generic [ref=e255]:
              - generic [ref=e256]: Неделя 24
              - generic [ref=e257]: 0%
            - paragraph [ref=e258]: Security
            - paragraph [ref=e259]: Пять атак на своего агента в локальной песочнице, затем защиты и регресс-тесты.
        - generic [ref=e261]:
          - heading "Evals" [level=2] [ref=e262]
          - paragraph [ref=e263]: Golden dataset, метрики, регресс в CI.
          - link "Неделя 25 0% Evals Автоматический eval pipeline с порогом регресса." [ref=e265] [cursor=pointer]:
            - /url: /week/evals
            - generic [ref=e266]:
              - generic [ref=e267]: Неделя 25
              - generic [ref=e268]: 0%
            - paragraph [ref=e269]: Evals
            - paragraph [ref=e270]: Автоматический eval pipeline с порогом регресса.
        - generic [ref=e272]:
          - heading "Observability" [level=2] [ref=e273]
          - paragraph [ref=e274]: Trace, cost, latency. Почему агент принял это решение.
          - link "Неделя 26 0% Observability Ответить «почему агент так решил» по trace, не по воспоминанию." [ref=e276] [cursor=pointer]:
            - /url: /week/observability
            - generic [ref=e277]:
              - generic [ref=e278]: Неделя 26
              - generic [ref=e279]: 0%
            - paragraph [ref=e280]: Observability
            - paragraph [ref=e281]: Ответить «почему агент так решил» по trace, не по воспоминанию.
        - generic [ref=e283]:
          - heading "Advanced AI Automation" [level=2] [ref=e284]
          - paragraph [ref=e285]: "Очереди, идемпотентность, HITL. Проект: AI Automation Platform."
          - generic [ref=e286]:
            - link "Неделя 27 0% Events & queues Очередь, worker, retry, backoff, idempotency, DLQ." [ref=e287] [cursor=pointer]:
              - /url: /week/event-driven-automation
              - generic [ref=e288]:
                - generic [ref=e289]: Неделя 27
                - generic [ref=e290]: 0%
              - paragraph [ref=e291]: Events & queues
              - paragraph [ref=e292]: Очередь, worker, retry, backoff, idempotency, DLQ.
            - link "Неделя 28 0% Agentic automation Событие → workflow → router → точечный агент → HITL → действие → аналитика. 80% без агента." [ref=e294] [cursor=pointer]:
              - /url: /week/agentic-automation
              - generic [ref=e295]:
                - generic [ref=e296]: Неделя 28
                - generic [ref=e297]: 0%
              - paragraph [ref=e298]: Agentic automation
              - paragraph [ref=e299]: Событие → workflow → router → точечный агент → HITL → действие → аналитика. 80% без агента.
        - generic [ref=e301]:
          - heading "AI Product Engineering" [level=2] [ref=e302]
          - paragraph [ref=e303]: Discovery, PRD, UX, прототип своего AI-продукта.
          - generic [ref=e304]:
            - link "Неделя 29 0% Discovery PRD своего AI-продукта на фактах, не на вайбе." [ref=e305] [cursor=pointer]:
              - /url: /week/discovery-research
              - generic [ref=e306]:
                - generic [ref=e307]: Неделя 29
                - generic [ref=e308]: 0%
              - paragraph [ref=e309]: Discovery
              - paragraph [ref=e310]: PRD своего AI-продукта на фактах, не на вайбе.
            - 'link "Неделя 30 0% UX/UI Критический путь: flow, wireframe, прототип. Не театр всех экранов." [ref=e312] [cursor=pointer]':
              - /url: /week/ux-ui-ai
              - generic [ref=e313]:
                - generic [ref=e314]: Неделя 30
                - generic [ref=e315]: 0%
              - paragraph [ref=e316]: UX/UI
              - paragraph [ref=e317]: "Критический путь: flow, wireframe, прототип. Не театр всех экранов."
        - generic [ref=e319]:
          - heading "Product Analytics" [level=2] [ref=e320]
          - paragraph [ref=e321]: События, воронки, эксперименты и Analytics Agent.
          - link "Неделя 31 0% Analytics События, воронка, эксперимент. Агент читает схему, не выдумывает метрики." [ref=e323] [cursor=pointer]:
            - /url: /week/product-analytics
            - generic [ref=e324]:
              - generic [ref=e325]: Неделя 31
              - generic [ref=e326]: 0%
            - paragraph [ref=e327]: Analytics
            - paragraph [ref=e328]: События, воронка, эксперимент. Агент читает схему, не выдумывает метрики.
        - generic [ref=e330]:
          - heading "Production AI" [level=2] [ref=e331]
          - paragraph [ref=e332]: Архитектура, деплой, лимиты, мониторинг, стоимость.
          - 'link "Неделя 32 0% Production Выкатить AI-систему с runbook: деградация, секреты, лимиты, мониторинг, стоимость." [ref=e334] [cursor=pointer]':
            - /url: /week/production-ai
            - generic [ref=e335]:
              - generic [ref=e336]: Неделя 32
              - generic [ref=e337]: 0%
            - paragraph [ref=e338]: Production
            - paragraph [ref=e339]: "Выкатить AI-систему с runbook: деградация, секреты, лимиты, мониторинг, стоимость."
        - generic [ref=e341]:
          - heading "Capstone" [level=2] [ref=e342]
          - paragraph [ref=e343]: Полноценный AI-продукт в портфолио по цепочке idea → production → iteration.
          - link "Неделя 33 0% Capstone Пройти цепочку idea → production → iteration 2 на реальной проблеме." [ref=e345] [cursor=pointer]:
            - /url: /week/capstone
            - generic [ref=e346]:
              - generic [ref=e347]: Неделя 33
              - generic [ref=e348]: 0%
            - paragraph [ref=e349]: Capstone
            - paragraph [ref=e350]: Пройти цепочку idea → production → iteration 2 на реальной проблеме.
  - alert [ref=e352]: Продолжить обучение
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("register, learn, persist", async ({ page }) => {
  4  |   const email = `tester-${Date.now()}@example.com`;
  5  |   await page.goto("/register");
  6  |   await page.getByLabel("Имя").fill("Тестер");
  7  |   await page.getByLabel("Email").fill(email);
  8  |   await page.getByLabel("Пароль").fill("password12");
  9  |   await page.getByRole("button", { name: "Создать аккаунт" }).click();
> 10 |   await expect(page.getByText("Продолжить обучение")).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  11 |   await page.getByRole("link", { name: "Continue Learning" }).click();
  12 |   await expect(page.getByText("Неделя 1")).toBeVisible();
  13 |   await page.getByRole("tab", { name: "Теория" }).click();
  14 |   await expect(page.getByText("Архитектура AI-приложения")).toBeVisible();
  15 |   await page.getByRole("button", { name: "Отметить, что прочитал" }).first().click();
  16 |   await page.getByRole("tab", { name: "Лаборатория" }).click();
  17 |   await page.getByPlaceholder("Заметки лаборатории").fill("Лаба в процессе");
  18 |   await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 });
  19 |   await page.getByRole("button", { name: "Лаборатория сделана" }).click();
  20 |   await page.getByRole("tab", { name: "Практика" }).click();
  21 |   await page.getByPlaceholder("Черновик, выводы, ссылки").fill("Сделаю клиент");
  22 |   await page.getByRole("button", { name: "Hint 1" }).click();
  23 |   await page.getByRole("tab", { name: "Квиз" }).click();
  24 |   await page.getByRole("tab", { name: "Артефакт" }).click();
  25 |   await page.getByPlaceholder("Ссылки, формулировки, чеклист текстом").fill("repo later");
  26 |   await page.getByRole("button", { name: /Артефакт готов/ }).click();
  27 |   await page.getByRole("button", { name: "Выйти" }).click();
  28 |   await page.goto("/login");
  29 |   await page.getByLabel("Email").fill(email);
  30 |   await page.getByLabel("Пароль").fill("password12");
  31 |   await page.getByRole("button", { name: "Войти" }).click();
  32 |   await expect(page.getByText("Продолжить обучение")).toBeVisible();
  33 |   await page.goto("/week/environment-llm-api");
  34 |   await expect(page.getByText("Неделя 1")).toBeVisible();
  35 | });
  36 | 
```