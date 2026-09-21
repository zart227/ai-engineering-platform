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
- **Goal:** вызвать одного специалиста и посчитать верхнюю границу вызовов.
- **Hours:** 10
- **Lessons:**
  1. Один специалист за запрос
  2. Четыре способа передать работу
  3. Общая доска пачкается
  4. Касса умножается
  5. Одного часто хватает
- **Lab:** маршрут billing, bug, research, остальные не стартуют.
- **Practice:** задача, где один вызов лучше комитета, с числами.
- **Artifact:** каталог координации и сравнение двух прогонов.
- **Decision card:** один агент или несколько.

### Week 21. Multi-Agent Architecture

- **Slug:** `multi-agent-architecture`
- **Goal:** финал только из утверждений, сверенных с id источника этого прогона.
- **Hours:** 14
- **Lessons:**
  1. Кто не пишет финал
  2. Источник этого прогона
  3. Клапан и критик
  4. Цена по ролям
  5. Пять вопросов
- **Lab:** свой file id проходит, чужой id не доходит до финала.
- **Practice:** журнал вызовов по ролям и вопрос вне корпуса.
- **Artifact:** **система исследования** с клапаном цитат и отчётом цены.
- **Decision card:** две роли или весь комитет.

---

## MODULE 10. Planning (week 22)

### Week 22. Planning & Replanning

- **Slug:** `planning`
- **Goal:** разложить цель в граф без циклов, сохранить сделанные узлы и при срыве пересобрать только хвост. Число перепланирований ограничено.
- **Hours:** 10
- **Lessons:**
  1. Цель не узел
  2. Граф без цикла
  3. Срыв и хвост
  4. Лимит перепланирования
  5. Код там, где шаг известен
- **Lab:** шесть узлов и срыв третьего: голова остаётся, хвост новый, третий replan не стартует.
- **Practice:** план против цикла на одной цели из шести шагов.
- **Artifact:** планировщик: граф, checkpoint, пересборка хвоста и лимит replan.
- **Decision card:** Реактивный цикл или граф.

---

## MODULE 11. Human-in-the-loop (week 23)

### Week 23. Approval, Pause, Permissions

- **Slug:** `human-in-the-loop`
- **Goal:** опасное действие остаётся pending, пока человек не подтвердит конкретную строку. Проверка по имени инструмента.
- **Hours:** 10
- **Lessons:**
  1. Пауза до кнопки
  2. Право по имени инструмента
  3. Кто нажал
  4. Что видит человек
  5. Обход формулировкой
- **Lab:** письмо не уходит из статуса pending.
- **Practice:** три формулировки цели не обходят один и тот же tool.
- **Artifact:** модуль прав, pending и аудит с user id.
- **Decision card:** Сразу исполнить или ждать человека.

---

## MODULE 12. AI Security (week 24)

### Week 24. Границы своего агента

- **Slug:** `ai-security`
- **Goal:** на локальных фикстурах закрыть пять дыр: инструкция пользователя, инструкция в документе, чужое описание инструмента, секрет в логе, смена роли текстом.
- **Hours:** 12
- **Lessons:**
  1. Текст с клавиатуры и текст из документа
  2. Описание инструмента не приказ
  3. Секрет не попадает в лог
  4. Слои, ни один не достаточен
  5. Пять фикстур и регресс
- **Lab:** пять проверок на своём процессе, без чужих систем.
- **Practice:** страница модели угроз и тест, что учебной метки нет в логе.
- **Artifact:** заметка об угрозах и тесты границ.
- **Decision card:** Правило в промпте или проверка в коде.

---

## MODULE 13. Evals (week 25)

### Week 25. Evaluation pipelines

- **Slug:** `evals`
- **Goal:** версионированный набор, held-out и код выхода, когда порог не достигнут.
- **Hours:** 12
- **Lessons:**
  1. Набор, который лежит в git
  2. Три способа судить
  3. Несколько чисел, одна выборка
  4. Порог в прогоне
  5. Граничные входы
- **Lab:** зелёный прогон и красный на сломанной фикстуре.
- **Practice:** ворота на held-out без ключа провайдера.
- **Artifact:** скрипт оценки с отчётом и порогом.
- **Decision card:** Судья-модель или проверка кодом.

---

## MODULE 14. Observability (week 26)

### Week 26. Why did the agent decide that?

- **Slug:** `observability`
- **Goal:** по request id видно, какой шаг упал. Секрет в span не попадает.
- **Hours:** 10
- **Lessons:**
  1. Один запрос, несколько отрезков
  2. Читать падение по файлу
  3. Что в span не кладут
  4. Обёртка вокруг вызова
  5. След против памяти чата
- **Lab:** причина падения названа по JSON следа.
- **Practice:** обёртка следа и три числа: успех, стоимость, задержка.
- **Artifact:** tracing middleware и разбор одного падения.
- **Decision card:** Переписать промпт или открыть след.

---

## MODULE 15. Advanced AI Automation (weeks 27-28)

### Week 27. Event-driven Automation

- **Slug:** `event-driven-automation`
- **Goal:** быстрый приём, воркер, повтор без второго эффекта, DLQ после лимита попыток.
- **Hours:** 12
- **Lessons:**
  1. Событие можно привезти дважды
  2. Статусы и аренда
  3. Пауза, потолок, DLQ
  4. Расписание как событие
  5. Когда очередь не нужна
- **Lab:** двойная доставка даёт один эффект, третий срыв уходит в DLQ.
- **Practice:** таблица jobs без обязательного Redis.
- **Artifact:** очередь, идемпотентный эффект и DLQ.
- **Decision card:** Прямой вызов или очередь.

### Week 28. Agentic Automation

- **Slug:** `agentic-automation`
- **Goal:** правило закрывает очевидное, агент не больше двух событий из десяти, WRITE ждёт человека.
- **Hours:** 12
- **Lessons:**
  1. Сначала правило
  2. Счётчики честнее ощущения
  3. Опасный хвост
  4. Уверенность не кнопка экономии любой ценой
  5. Сборка v1
- **Lab:** на десяти фикстурах агент вызван не больше двух раз.
- **Practice:** срез приёма, маршрутизатора, редкого агента и pending.
- **Artifact:** платформа автоматизации v1.
- **Decision card:** Правило или агент на этом событии.

---

## MODULE 16. AI Product Engineering (weeks 29-30)

### Week 29. Discovery & Research

- **Slug:** `discovery-research`
- **Goal:** журнал фактов, одна закрытая гипотеза и PRD одной роли.
- **Hours:** 12
- **Lessons:**
  1. Факт, не мнение
  2. Гипотеза, которую можно убить
  3. Где модель запрещена
  4. Истории, которые можно проверить
  5. Скептик по тексту
- **Lab:** десять записей и одна закрытая гипотеза.
- **Practice:** PRD с не-целями, границей модели и черновиком стоимости.
- **Artifact:** журнал и PRD.
- **Decision card:** Писать код или закрыть гипотезу.

### Week 30. UX/UI + AI

- **Slug:** `ux-ui-ai`
- **Goal:** один путь из пяти кадров, включая ожидание и отказ.
- **Hours:** 12
- **Lessons:**
  1. Пять кадров, не продукт целиком
  2. Отказ не прячут
  3. Макет ускоряет, продукт остаётся вашим
  4. Из картинки в код
  5. Одна рубрика на человека и на модель
- **Lab:** схема и кадры отказа и ожидания.
- **Practice:** кликабельный прототип и заметка прогона с человеком.
- **Artifact:** путь, прототип и рубрика.
- **Decision card:** Ещё экраны или прогон одного пути.

---

## MODULE 17. Product Analytics (week 31)

### Week 31. Analytics & Analytics Agent

- **Slug:** `product-analytics`
- **Goal:** воронка считается кодом. Неизвестной метрики нет в схеме, значит отказ, не процент.
- **Hours:** 12
- **Lessons:**
  1. Имена, которые не плывут
  2. Воронку считает код
  3. Один рычаг
  4. Агент читает схему
  5. События учат продукт, не следят ради рекламы
- **Lab:** четыре имени, три шага, отказ на выдуманной метрике.
- **Practice:** агент схемы возвращает запрос или abstain.
- **Artifact:** схема событий, воронка и отказ без числа.
- **Decision card:** Спросить модель или посчитать.

---

## MODULE 18. Production AI (week 32)

### Week 32. Production architecture

- **Slug:** `production-ai`
- **Goal:** дежурный понимает секреты, копию данных и что сказать при 429.
- **Hours:** 16
- **Lessons:**
  1. Образ, база, секрет
  2. Дешёвый шаг и дорогой шаг
  3. 429 не тишина
  4. Сначала вертикаль
  5. Чужой дежурный читает страницу
- **Lab:** мок ограничения показывает текст, не пустой экран.
- **Practice:** runbook без оркестратора, которого нет.
- **Artifact:** страница дежурства и фикстура 429.
- **Decision card:** Модульный монолит или отдельный сервис.

---

## CAPSTONE

- **Slug:** `capstone`
- **Goal:** узкий продукт: боль, запуск, оценка, заметка об угрозах, четыре события и вторая итерация по наблюдению.
- **Hours:** 40
- **Lessons:**
  1. Узкий срез, не весь курс
  2. Сначала то, что можно проверить без модели
  3. Оценка и угрозы до объявления готовности
  4. Вторая итерация по следу
  5. Рассказ на пять минут
- **Lab:** граница среза и граф работ без цикла.
- **Practice:** путь, который открывает другой человек.
- **Artifact:** запуск, документ, оценка, события и итерация 2.
- **Decision card:** Добавить приём из курса или оставить не-целью.

Сквозной проект курса: сама `ai-engineering-platform` эволюционирует по мере недель.
