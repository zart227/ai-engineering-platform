# Implementation Status

Baseline: `origin/main` `839f135` (старт Wave 0). Последняя сверка Wave 8 / GATE FINAL: `5fa4fc6` (PRs #7–#29).
Аудит-документы описывают тот же коммит. Расхождения с кодом ниже — результат сверки R1–R6 и Wave 8, а не повторного доверия к DOCX.

Статусы: `NOT_STARTED` | `PARTIAL` | `READY_FOR_VERIFICATION` | `DONE` | `BLOCKED` | `NOT_APPLICABLE`.

| ID | Requirement | Status | Evidence | Owner | Dependencies | Action |
| -- | ----------- | ------ | -------- | ----- | ------------ | ------ |
| W0-RECON | R1–R6 read-only audit vs `839f135` | DONE | Этот каталог, контракты агентов | Orchestrator | — | Закрыто |
| W0-DOCS | Audit control docs | DONE | `docs/audit/*` | Orchestrator | W0-RECON | Закрыто |
| P0-EXPORT | Полный backup learner state | DONE | `buildExport` пишет formatVersion 3, включая `RecallReview` (weekSlug, itemIndex, prompt, nextReviewAt, reviewCount). Импорт принимает v2 и v3. v2 расписание не стирает, и превью это говорит. v3, включая ноль карточек, в превью предупреждает о полной замене. Roundtrip интервалов 1, 3, 7, 21 дня: `tests/export.test.ts`. Capstone replace-on-import (deleteMany+create): PR #25. Проверено на `cac6473` | Agent B | — | Закрыто |
| P0-IMPORT | Validate → version → migrate → preview → transaction → result | DONE | `migrateExport`, `previewImport`, `$transaction`. v1 не удаляет квизы и события. `importLearningAction` возвращает `importExport` и после транзакции не вызывает `safePersistWeek`. Полная замена learner state включая capstone; quiz re-score: PRs #10, #21, #25. Проверено на `cac6473` | Agent B | P0-EXPORT | Закрыто |
| P0-SECRETS | Не экспортировать password hash и session token | DONE | `buildExport` отдаёт только email/name | — | — | Сохранить инвариант в v2 |
| P0-IDOR | Portfolio update только своего пользователя | DONE | `updateMany` where `{ id, userId }` | Agent B | — | Закрыто |
| P0-DOCS | Архитектурные документы = текущий код | DONE | `PLATFORM.md` §A описывает текущий стек. Снимок `127ddb5` подписан как история. Регистрация недель в `course/index.ts` | Agent A | — | Закрыто |
| P0-CAPSTONE-UI | 32 недели + отдельный Capstone, без семантики «Неделя 33» | DONE | `weekLabel`: capstone → «Финальный проект». Глоссарий использует тот же helper | Agent A | — | Закрыто |
| P0-I18N | Русские подписи интерфейса | DONE | Хром: «Продолжить», «Сохранено», «Подготовка», «Что уже нужно», статусы портфолио по-русски. Названия модулей в curriculum не переводились | Agent A | — | Закрыто |
| P0-DEAD | Подтверждённый мёртвый код | DONE | `compact.ts` удалён. `course/legacy/README.md` помечает архив | Agent A | — | Закрыто |
| P0-RATELIMIT | Auth rate limit shared across instances | DONE | `rateLimitPersisted` + `RateLimitBucket` (migration `20260922120900_rate_limit_bucket`); login 8 / register 5 per 15m; email `trim().toLowerCase()` (PR #23); `tests/rate-limit-store.test.ts`, `tests/auth-rate-limit.test.ts`. Tutor stays in-process `rateLimit` (per-user, single-process OK). PR #28. Проверено на `5fa4fc6` | Wave 8 | — | Закрыто |
| P0-PROXY | Cookie presence = UX gate, сессия проверяется на сервере | DONE | `src/proxy.ts` смотрит cookie; `getSession()` проверяет hash и срок | — | — | Оставить границу явной в доке |
| P0-DEEPLINK | `?next=` после логина | DONE | `loginAction` читает `next` и зовёт `safeInternalPath`. Внешний URL, `//`, `\` и значение без ведущего `/` остаются на `/`. Проверено на `1592ea9` | Wave 5.1 | — | Закрыто |
| C-W1 | Week 1: streaming vs normal, TTFT и total latency, retries в lab | DONE | Lab: stream false/true, TTFT, total, retry 429, без retry 401 | Agent C | — | Закрыто для Wave 1. Финальный проход ещё в C1 |
| C-W2 | Week 2: RU/EN/JSON/code tokens, temperature, top-p, variance | DONE | Студент измеряет четыре формы, temperature, top-p и пять повторов | Agent C | — | Закрыто для Wave 1 |
| C-W3 | Week 3: Prompt A vs B на dataset | DONE | Golden set, accuracy и cost в `week-03.ts`. Нет decision card и sources | Agent C | — | Добить card + source, не переписывать |
| C-W4 | Week 4: plain JSON vs schema-constrained, parse/schema/latency/tokens | DONE | A/B: prompt JSON vs `json_schema` strict, таблица отказов и токенов | Agent C | — | Закрыто для Wave 1 |
| C-SCHEMA | Course Quality Contract | DONE | Опциональные поля на `Week`. Обязательными не стали. Документ: `content-schema.md` | Agent E | GATE 1 | Закрыто |
| C-RUBRIC | ArtifactRubric first-class | DONE | Все 33 недели: рубрика, сумма весов 100. Недели 2, 25 и 32 имеют пятый критерий. CR прошёл. Проверено на `1592ea9` | C1–C10 | C-SCHEMA | Закрыто |
| C-ASSESS | Scenario/debug assessments, порог ~80% для сложных недель | DONE | Все 33 недели: 8 вопросов, четыре вида. `passScore` 70, старые попытки не пересчитываются | C1–C10 | C-SCHEMA | Порог 80% не включали |
| C-SR | Spaced repetition | DONE | `RecallReview.nextReviewAt` на пользователя, неделю и вопрос. Пропуск не сдвигает срок. Дашборд: «Сегодня повторить», capstone как «Финальный проект» | Wave 5 P2 | — | Без Redis и воркера |
| C-RAG | Глубина RAG ingestion/chunking/eval | DONE | Week 16: Recall@K отдельно от citation/answer correctness. Термин в глоссарии | C4 | GATE 2 | Закрыто |
| C-MCP | MCP threat model | DONE | Week 18: Host → Client → Server, tool shadowing и отказ host по своему списку путей | C5 | GATE 2 | Закрыто |
| C-BUDGET | AgentBudget | DONE | Week 12: интерфейс в учебном коде, maxCost и toolBudget. Не тип платформы | C3 | GATE 2 | Закрыто |
| C-DIST | at-most-once / exactly-once illusion названы | DONE | Week 27 и термины глоссария: at-most-once, at-least-once, exactly-once | C8 | GATE 2 | Закрыто |
| C-MISSING | Local models, serving, fine-tune, routing, privacy taxonomy | DONE | M1 неделя 2: llama.cpp как движок в уроке и лаборатории, замер одного prompt hosted и local обязателен в рубрике `how-llms-work-r5`. M2 неделя 32: цепочка и выбор latency или throughput в `production-ai-r5`, отдельно от шага клиента. M3 неделя 25: три строки рычагов в `eval-r5`. M4 неделя 10: шаг «Fallback провайдера» на месте. M5 неделя 24 не ломалась. GATE 4 закрыт на `1592ea9` | M1–M5 | GATE 3 | Закрыто |
| T-CI | PR: typecheck, lint, test, build | DONE | `.github/workflows/ci.yml` | Agent D | — | Закрыто |
| T-CONTRACT | Unique ids/slugs, refs, no TODO/placeholder | DONE | `tests/curriculum-integrity.test.ts` | Agent D | — | Закрыто |
| T-EXPORT | Тесты export/import | DONE | `tests/export.test.ts`: v1→v2, секреты, preview. Сырой v2 не вызывает deleteMany у RecallReview. Ошибка внутри транзакции откатывает черновик. Живая база по-прежнему не нужна этому файлу | Agent B | P0-IMPORT | Схема закрыта |
| UX-NAV | Sidebar tree, breadcrumbs, mobile week nav | DONE | `WeekNav`: модули, крошки «Курс → модуль → неделя», disclosure ниже lg | Agent G | GATE 1 | Закрыто |
| UX-NEXT | Где я и что дальше внутри недели | PARTIAL | Dashboard знает current week; вкладки без статуса | Agent G | — | Wave 2 |
| P1-ANALYTICS | Funnel по LearningEvent | DONE | Единица user-week. Порядок: week_opened → lesson_started → lesson_completed → practice_completed → quiz_passed → artifact_completed → week_completed. Поздний тип не обгоняет предыдущий шаг. Конверсия и отсев в процентах, отсев ещё и числом. Проверено на `1592ea9` | Wave 5.1 | — | Закрыто |
| P3-SEARCH | Хеш-поиск ученика | DONE | pgvector и `CourseChunk` остаются. Косинус `<=>` по вектору `feature-hash-v1`: хеш слов, префиксов и биграмм, 384 измерения. Перефраз без общих слов не находится. Страница `/search` и `course.search` называют это хеш-поиском. Проверено на `1592ea9` | Wave 5.1 | Use case подтверждён | Закрыто |
| P4-MCP | Platform MCP server | DONE | `POST /api/mcp`, ревизия 2026-07-28: `course.search`, `course.lesson`, `user.progress`, `user.notes`. Прогресс и заметки только через `getSession()`, аргумент userId игнорируется. Проверено на `1592ea9` | Wave 5.1 | Курс MCP | Закрыто |
| W6-REDIS | Redis/queue | NOT_APPLICABLE | Use case не доказан. Платформа — один процесс + Postgres | Wave 6 | Измеренная боль | Не ставить зависимость |
| W7-TUTOR | AI Tutor V1 (V2–V4 deferred) | DONE | V1 на `8620a62`: `POST /api/tutor`, `src/server/tutor.ts`, Ollama routine без fallback на OpenAI, `getSession()` + per-owner rate limit 20/15m, контекст без solution/quiz/recall/check.answer, без `searchCourse`; `reply_rejected` при утечке solution; UI `LessonTutor` на theory; `tests/tutor.test.ts`; browser smoke week 1 (orchestrator run Sep 2026). **Out of scope / deferred:** V2 citations, V3 rubric feedback, V4 multi-week/long_generation, 99-hint eval suite (T5), heavy OpenAI flows | Wave 7 | GATE 3+ | GATE 7 закрыт для V1 |

Финальный `DONE` по implementation-пунктам ставит только Orchestrator после review и gate.
