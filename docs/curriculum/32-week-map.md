# 32-week curriculum map

Программа: **AI Engineer & Automation Developer**.
Платформа: `ai-engineering-platform`.
Актуально на: 2026-09-21.

Ориентир: 8 месяцев, ~350 часов, 65-70% практики.
Язык кода: TypeScript / Node.js. Python: только как инструмент AI Engineering.

Каждая неделя заканчивается артефактом. Без артефакта неделя не 100%.

---

## MODULE 1. AI Fundamentals (weeks 1-4)

### Week 1. AI Development Environment + LLM API

- **Slug:** `environment-llm-api`
- **Goal:** поднять окружение, сделать первый устойчивый LLM-клиент, понять токены, ошибки, деньги.
- **Prerequisites:** Git, Node.js, базовый TypeScript, `.env` как идея.
- **Hours:** 10
- **Technologies:** Node 22, TypeScript, fetch, OpenAI-compatible API, dotenv
- **Track:** Engineering
- **Lessons:**
  1. Архитектура AI-приложения: client, provider, model, tool, data
  2. Providers, модели, API keys, `.env`, least privilege
  3. Messages, roles, streaming, retries, idempotent clients
  4. Tokens, latency, cost: как считать до продакшена
  5. Ошибки провайдера: 401, 429, 5xx, timeouts, что логировать нельзя
- **Lab:** CLI, который читает prompt из stdin, стримит ответ, печатает usage.
- **Practice:** HTTP endpoint `POST /complete` с валидацией, timeout, structured error.
- **Artifact:** работающий TypeScript LLM client + README с таблицей стоимости.
- **Project:** заготовка LLM Playground.

### Week 2. How LLMs Work

- **Slug:** `how-llms-work`
- **Goal:** объяснить модель достаточно, чтобы выбирать параметры и не верить галлюцинациям.
- **Hours:** 10
- **Lessons:**
  1. AI / ML / DL: что инженеру нужно, что нет
  2. Transformer, attention, context window без магии
  3. Tokenizer и embeddings: почему «слово» != токен
  4. Sampling: temperature, top-p, seed, reasoning traces
  5. Hallucinations, multimodality, когда модель врёт уверенно
- **Lab:** один и тот же prompt, сетка параметров, таблица качества/стоимости.
- **Practice:** объяснить в README, почему два ответа разошлись.
- **Artifact:** отчёт экспериментов + правила выбора параметров.

### Week 3. Prompt Engineering

- **Slug:** `prompt-engineering`
- **Goal:** превратить промпт из чата в версионируемый артефакт.
- **Hours:** 10
- **Lessons:**
  1. System / developer / user: иерархия инструкций
  2. Zero-shot, few-shot, role, delimiters, decomposition
  3. Шаблоны, переменные, prompt versioning
  4. Оценка промптов: golden set из 10 случаев
- **Lab:** Prompt Evaluation Playground (минимальный UI или CLI).
- **Practice:** два шаблона на одну задачу, измерить win-rate.
- **Artifact:** библиотека шаблонов + eval-таблица.

### Week 4. Context Engineering + Structured Output

- **Slug:** `context-structured-output`
- **Goal:** собирать контекст сознательно и заставлять модель отвечать схемой.
- **Hours:** 12
- **Lessons:**
  1. Context composition и budget
  2. Context pollution, compression, history
  3. JSON Schema, Zod, валидация, ремонт ответа
  4. Instruction hierarchy и untrusted input
- **Lab:** structured extraction с ретраем при невалидном JSON.
- **Practice:** диалог с усечением истории по бюджету токенов.
- **Artifact:** **LLM Playground v1** (prompt, model, params, schema, tokens, latency, cost).
- **Decision card:** small vs large model.

---

## MODULE 2. AI-Assisted Software Engineering (weeks 5-6)

### Week 5. Professional AI Coding

- **Slug:** `professional-ai-coding`
- **Goal:** spec-driven работа с coding agents, не «напиши функцию».
- **Hours:** 10
- **Lessons:**
  1. Чат, assistant и coding agent
  2. Инструкции репозитория: AGENTS.md, Cursor rules, CLAUDE.md, бюджет
  3. Specification-driven цикл и декомпозиция
  4. Большой репозиторий и бюджет контекста
  5. Ограничения агента, зависимости, human oversight
- **Lab:** маленькая фича через spec → карта путей → план → diff → review.
- **Practice:** написать AGENTS.md и пару слабый/сильный запрос.
- **Artifact:** ветка со спекой, узким патчем и AGENTS.md.
- **Decision card:** чат или coding agent.

### Week 6. AI Debugging, Testing & Review

- **Slug:** `ai-debug-test-review`
- **Goal:** не принимать код модели пока нет теста, ревью и проверки зависимостей.
- **Hours:** 10
- **Lessons:**
  1. Гипотеза раньше патча
  2. Тест, которым владеет человек
  3. Ревью диффа и зависимости
  4. Security review агентного патча
  5. Playbook и граница делегирования
- **Lab:** учебный сломанный патч: выдуманный API, порча данных, снятая проверка. Красный тест, потом фикс.
- **Practice:** PLAYBOOK.md на одну-две страницы.
- **Artifact:** playbook и след красного/зелёного теста.
- **Decision card:** сразу патч или сначала гипотеза.

---

## MODULE 3. Automation Engineering (weeks 7-10)

### Week 7. Automation Fundamentals

- **Slug:** `automation-fundamentals`
- **Goal:** отличить script, workflow, AI workflow, agent.
- **Hours:** 10
- **Lessons:**
  1. Пять форм: script, cron, workflow, AI workflow, agent
  2. Trigger, действие, состояние
  3. Cron, лок и двойной запуск
  4. Детерминированная граница
  5. Карта рутин
- **Lab:** идемпотентный прогон с фазами reserved и done.
- **Practice:** карта пяти рутин.
- **Artifact:** таблица рутин и скрипт с одним side effect на ключ.
- **Decision card:** workflow или агент.

### Week 8. n8n

- **Slug:** `n8n`
- **Goal:** понять n8n как движок, не как конструктор кликов.
- **Hours:** 10
- **Lessons:**
  1. Workflow, item, execution, credentials
  2. Выражения, ветки и Code node
  3. Под-workflow
  4. Расписание, webhook и error workflow
  5. Когда граф хуже репозитория
- **Lab:** webhook, ветка, Stop And Error, Error Trigger.
- **Practice:** тот же маршрут графом и функцией route.
- **Artifact:** экспорт без секретов и сравнение с кодом.
- **Decision card:** n8n или код.
- **Актуально на:** 2026-09-21 (docs.n8n.io).

### Week 9. APIs, Webhooks & Integrations

- **Slug:** `apis-webhooks`
- **Goal:** надёжно говорить с чужими системами.
- **Hours:** 10
- **Lessons:**
  1. Клиент чужого API: таймаут, курсор, лимит
  2. API key и OAuth
  3. HMAC по сырому телу и replay
  4. Ответ 2xx, ретрай, когда ещё не нужна очередь
  5. Контракт интеграции и фикстуры
- **Lab:** приём с подписью, окном времени и одним side effect на event id.
- **Practice:** клиент страниц с потолком и без ретрая на 400.
- **Artifact:** модуль приёма и клиент.
- **Decision card:** ключ приложения или OAuth.

### Week 10. AI Automation

- **Slug:** `ai-automation`
- **Goal:** вставить LLM в детерминированный пайплайн с валидацией и fallback.
- **Hours:** 10
- **Lessons:**
  1. Класс, поля, маршрут
  2. Схема на выходе шага
  3. Fallback и человек
  4. Цена пачки
  5. Проект AI Office Automation
- **Lab:** конвейер на фиктивной модели.
- **Practice:** 20 примеров, инъекции, порог для крона.
- **Artifact:** **AI Office Automation** v1. Маршрут в коде, письмо клиенту само не уходит.
- **Decision card:** шаг модели или агент.

---

## MODULE 4. Tools & Agents (weeks 11-12)

### Week 11. Tool Calling

- **Slug:** `tool-calling`
- **Goal:** принять имя инструмента и аргументы, проверить схемой и правами и только потом выполнить.
- **Hours:** 12
- **Lessons:**
  1. Предложение, не исполнение
  2. Схема аргументов
  3. Результат, ошибка, повтор
  4. Несколько вызовов сразу
  5. Allowlist и журнал
- **Lab:** search, calculator, notes.write и журнал каждого вызова.
- **Practice:** отказ в delete до switch, идемпотентный notes.write.
- **Artifact:** tool runtime, allowlist и audit log.
- **Decision card:** чтение параллельно или всё по очереди.

### Week 12. Agent Loop from Scratch

- **Slug:** `agent-loop`
- **Goal:** собрать цикл цель, модель, инструмент, наблюдение и состояние без фреймворка.
- **Hours:** 12
- **Lessons:**
  1. Один цикл на экране
  2. Почему цикл обязан умереть
  3. Состояние и trace
  4. Инструмент сломался
  5. Personal AI Agent
- **Lab:** цикл с потолком 8 шагов и фиктивным decide.
- **Practice:** сломать цикл повтором и не писать «записано» без notes.write ok.
- **Artifact:** **Personal AI Agent** и текстовый trace с причиной выхода.
- **Decision card:** один вызов или цикл.

---

## MODULE 5. Embeddings & RAG (weeks 13-16)

### Week 13. Embeddings

- **Slug:** `embeddings`
- **Goal:** посчитать близость самим кодом и оставить точный идентификатор в SQL.
- **Hours:** 10
- **Lessons:**
  1. Вектор фиксированной длины
  2. Три меры близости
  3. Перебор ближайших
  4. Ложные соседи
  5. Точный ключ остаётся в SQL
- **Lab:** поиск по 50 чанкам и один ложный сосед.
- **Practice:** три удачных попадания и два ложных с цитатой механизма.
- **Artifact:** CLI семантического поиска и отчёт.
- **Decision card:** SQL и полнотекст или вектор.

### Week 14. PostgreSQL + pgvector

- **Slug:** `pgvector`
- **Goal:** хранить вектор рядом с tenant_id и понимать, что ANN приближает ответ.
- **Hours:** 10
- **Lessons:**
  1. Колонка vector и оператор
  2. Чужой тенант не попадает в контекст
  3. Сначала точный план
  4. HNSW и IVFFlat
  5. Второй движок по замеру
- **Lab:** k-NN с фильтром tenant_id.
- **Practice:** замер на 1000 строк против точного плана.
- **Artifact:** миграция, фильтр и замер.
- **Decision card:** pgvector или отдельный движок.

### Week 15. RAG

- **Slug:** `rag`
- **Goal:** собрать путь от файла до ответа с цитатой или отказом.
- **Hours:** 12
- **Lessons:**
  1. Пять стадий
  2. Окно нарезки
  3. Контекст из выборки
  4. Цитата из списка id
  5. Пустая опора
- **Lab:** пять файлов, вопрос внутри корпуса и вопрос снаружи.
- **Practice:** POST /ask с citations и abstain.
- **Artifact:** сервис вопросов v1.
- **Decision card:** весь документ в окно или RAG.

### Week 16. Advanced RAG

- **Slug:** `advanced-rag`
- **Goal:** измерить hit-rate и добавить один приём, только если число выросло.
- **Hours:** 12
- **Lessons:**
  1. Золотые вопросы
  2. Перефраз запроса
  3. Полнотекст рядом с вектором
  4. Перестановка кандидатов
  5. Платформа знаний
- **Lab:** hit-rate@5 до и после одного приёма на 20 вопросах.
- **Practice:** черновик и чужой tenant не попадают в выдачу.
- **Artifact:** **AI Knowledge Platform** (compose, eval, README).
- **Decision card:** наивная выборка или ещё один этап.

---

## MODULE 6. Memory (week 17)

### Week 17. Agent Memory

- **Slug:** `agent-memory`
- **Goal:** разделить черновик цикла, журнал эпизодов и короткие факты. Забвение удаляет строку.
- **Hours:** 12
- **Lessons:**
  1. Три слоя
  2. Сжатие и выборка
  3. Забвение удаляет строку
  4. Секрет не становится фактом
  5. Один прогон или база
- **Lab:** remember и forget, секрет не получает id.
- **Practice:** политика памяти и тесты visible.
- **Artifact:** модуль памяти Personal Agent и политика хранения.
- **Decision card:** память процесса или база.

---

## MODULE 7. MCP (week 18)

### Week 18. Model Context Protocol

- **Slug:** `mcp`
- **Goal:** сервер заметок по ревизии 2026-07-28, путь не выходит из корня.
- **Hours:** 12
- **As-of:** 2026-09-21, спецификация 2026-07-28.
- **Lessons:**
  1. Три роли
  2. Запрос несёт версию сам
  3. Три примитива сервера
  4. stdio и один POST
  5. Описание инструмента недоверенно
- **Lab:** discover, tools/list, отказ на путь вне корня.
- **Practice:** два tool, resource, prompt, тест traversal.
- **Artifact:** репозиторий MCP-сервера и заметка, чем он отличается от runtime недели 11.
- **Decision card:** allowlist в процессе или MCP-сервер.

---

## MODULE 8. Agent Frameworks (week 19)

### Week 19. Agent SDKs & Frameworks

- **Slug:** `agent-frameworks`
- **Goal:** назвать, что SDK забирает у своего цикла, и не снимать лимит шагов.
- **Hours:** 10
- **As-of:** 2026-09-21, страницы OpenAI Agents JS и AI SDK ToolLoopAgent.
- **Lessons:**
  1. Три полки
  2. Что раннер уже написал
  3. Лимит не отдают молча
  4. Таблица переноса
  5. Маленький цикл остаётся своим
- **Lab:** один сценарий notes.search и таблица из четырёх строк.
- **Practice:** записка с решением взять SDK или оставить свой цикл.
- **Artifact:** COMPARE.md и тест, что лимит шагов включён.
- **Decision card:** свой цикл или SDK.

---

## MODULE 9. Multi-Agent (weeks 20-21)

### Week 20. Multi-Agent Fundamentals

- **Slug:** `multi-agent-fundamentals`
- **Goal:** паттерны и цена координации.
- **Hours:** 10
- **Lessons:**
  1. Supervisor, router, handoff, agents-as-tools
  2. Shared state vs isolated context
  3. Стоимость и каскад ошибок
  4. Single vs multi-agent
- **Lab:** router на 3 специалиста.
- **Practice:** задача, которую multi-agent ухудшает.
- **Artifact:** pattern catalog.
- **Decision card:** single vs multi-agent.

### Week 21. Multi-Agent Architecture

- **Slug:** `multi-agent-architecture`
- **Goal:** Deep Research с фактчеком и цитатами.
- **Hours:** 14
- **Lessons:**
  1. Supervisor + Researcher + Analyst + Fact Checker + Critic + Finalizer
  2. Citations и source validation
  3. Trace и cost measurement
  4. Evaluation исследовательского ответа
- **Lab:** система отвечает на вопрос со списком источников.
- **Practice:** fact checker ловит выдуманную ссылку.
- **Artifact:** **Multi-Agent Deep Research System**.

---

## MODULE 10. Planning (week 22)

### Week 22. Planning & Replanning

- **Slug:** `planning`
- **Goal:** декомпозиция цели, DAG, checkpoints, перепланирование.
- **Hours:** 10
- **Lessons:**
  1. Goal vs task decomposition
  2. DAG и зависимости
  3. Execution, verification, replan
  4. State machines vs свободный агент
- **Lab:** план из 6 шагов с checkpoint и срывом шага 3.
- **Practice:** сравнить план vs реактивный цикл на той же задаче.
- **Artifact:** planner module.

---

## MODULE 11. Human-in-the-loop (week 23)

### Week 23. Approval, Pause, Permissions

- **Slug:** `human-in-the-loop`
- **Goal:** опасные действия не проходят без человека.
- **Hours:** 10
- **Lessons:**
  1. Approval, pause/resume, escalation
  2. Permission model: READ / WRITE / DELETE / FINANCIAL / ADMIN
  3. Audit log
  4. UX паузы агента
- **Lab:** агент хочет отправить письмо: ждёт approve.
- **Practice:** обойти HITL нельзя сменой формулировки цели.
- **Artifact:** permission + audit module.

---

## MODULE 12. AI Security (week 24)

### Week 24. Attack then defend

- **Slug:** `ai-security`
- **Goal:** атаковать своего агента локально, затем закрыть дыры.
- **Hours:** 12
- **Lessons:**
  1. Prompt injection и indirect injection
  2. Malicious RAG documents, tool poisoning
  3. Data exfiltration, excessive agency, privilege escalation
  4. Guardrails: input/output validation, sandbox, secrets
- **Lab:** 5 атак, 5 защит, регресс-тесты.
- **Practice:** секрет в логах считается провалом лабы.
- **Artifact:** threat model + hardened agent.

---

## MODULE 13. Evals (week 25)

### Week 25. Evaluation pipelines

- **Slug:** `evals`
- **Goal:** качество измеряется датасетом, не ощущением.
- **Hours:** 12
- **Lessons:**
  1. Golden dataset, split, leakage
  2. Deterministic tests vs model-based vs human
  3. Метрики: task success, tool accuracy, retrieval, hallucination, safety, latency, cost
  4. Regression gates в CI
- **Lab:** pipeline, который падает при деградации hit-rate.
- **Practice:** 30 кейсов на свой RAG или агент.
- **Artifact:** automatic evaluation pipeline.

---

## MODULE 14. Observability (week 26)

### Week 26. Why did the agent decide that?

- **Slug:** `observability`
- **Goal:** каждый decision имеет trace.
- **Hours:** 10
- **Lessons:**
  1. Trace, span, generation, tool call, handoff
  2. Tokens, cost, latency
  3. Debugging по трейсу, не по чату
  4. Что нельзя логировать
- **Lab:** открыть падение агента только по trace.
- **Practice:** дашборд трёх чисел: success, cost, latency.
- **Artifact:** tracing middleware.

---

## MODULE 15. Advanced AI Automation (weeks 27-28)

### Week 27. Event-driven Automation

- **Slug:** `event-driven-automation`
- **Goal:** очереди, воркеры, retries, DLQ, идемпотентность.
- **Hours:** 12
- **Lessons:**
  1. Events vs requests
  2. Queues, workers, backoff
  3. Idempotency keys, DLQ
  4. Scheduled jobs
- **Lab:** producer → queue → worker, повтор не дублирует side effect.
- **Practice:** отравить worker и показать DLQ.
- **Artifact:** очередь + идемпотентный обработчик.
- **Decision card:** sync vs async; queue vs direct.

### Week 28. Agentic Automation

- **Slug:** `agentic-automation`
- **Goal:** событие запускает workflow, агент подключается точечно, человек подтверждает опасное.
- **Hours:** 12
- **Lessons:**
  1. Event → workflow → router → agent
  2. RAG/memory/MCP как опции, не как дефолт
  3. Human approval → action → DB → analytics
  4. Операционные SLO автоматизации
- **Lab:** тикет → класс → (агент | правило) → approve → действие.
- **Practice:** 80% потока без агента.
- **Artifact:** **AI Automation Platform** v1.

---

## MODULE 16. AI Product Engineering (weeks 29-30)

### Week 29. Discovery & Research

- **Slug:** `discovery-research`
- **Goal:** PRD своего AI-продукта на фактах, не на вайбе.
- **Hours:** 12
- **Lessons:**
  1. User problem, JTBD, evidence log
  2. Deep research и проверка источников
  3. Competitors, hypothesis, assumptions
  4. PRD и user stories
- **Lab:** 10 фактов с URL, узкая проблема, PRD v1.
- **Practice:** убить одну гипотезу данными.
- **Artifact:** полный PRD.

### Week 30. UX/UI + AI

- **Slug:** `ux-ui-ai`
- **Goal:** от user flow до прототипа без театра в Figma.
- **Hours:** 12
- **Lessons:**
  1. IA, user flow, wireframes
  2. Design systems и AI-assisted design
  3. Prototype ключевого пути
  4. Design → code: что теряется
- **Lab:** 5 экранов критического пути.
- **Practice:** прототип на одном сценарии, не на всём продукте.
- **Artifact:** flow + прототип + критерии теста.

---

## MODULE 17. Product Analytics (week 31)

### Week 31. Analytics & Analytics Agent

- **Slug:** `product-analytics`
- **Goal:** события, воронка, эксперименты; агент помогает читать данные, не подменяет их.
- **Hours:** 12
- **Lessons:**
  1. Events, funnels, conversion
  2. Retention, cohorts, feature usage
  3. Experiments
  4. Analytics Agent: вопросы к данным со схемами
- **Lab:** 4 события, воронка из 3 шагов, один инсайт.
- **Practice:** агент не имеет права выдумать метрику, которой нет.
- **Artifact:** **Analytics Agent** + схема событий.

---

## MODULE 18. Production AI (week 32)

### Week 32. Production architecture

- **Slug:** `production-ai`
- **Goal:** выкатить AI-систему так, чтобы она жила неделю без героизма.
- **Hours:** 16
- **Lessons:**
  1. Docker, CI/CD, secrets, backups
  2. Postgres, Redis, queues, workers
  3. Streaming: SSE / WebSocket
  4. Model routing, rate limits, retries, caching
  5. Monitoring, scaling, cost optimization
- **Lab:** чеклист продакшена на LLM Playground или Knowledge Platform.
- **Practice:** инцидент: провайдер 429, система деградирует, не молчит.
- **Artifact:** production runbook + архитектура.
- **Decision card:** monolith vs service.

---

## CAPSTONE

- **Slug:** `capstone`
- **Goal:** полноценный AI SaaS / продукт в портфолио.
- **Hours:** 40+
- **Цепочка:** real problem → research → competitors → user problem → hypothesis → validation → PRD → architecture → UX → prototype → development → AI integration → automation → agents → RAG/memory only if needed → tests → evals → security → deploy → analytics → feedback → iteration 2.
- **Artifact:** живой URL, README, архитектура, evals, threat model, аналитика.

Сквозной проект курса: сама `ai-engineering-platform` эволюционирует по мере недель.
