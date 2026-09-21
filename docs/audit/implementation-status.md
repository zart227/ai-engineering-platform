# Implementation Status

Baseline: `origin/main` `839f135` (совпадает с HEAD на старте Wave 0).
Аудит-документы описывают тот же коммит. Расхождения с кодом ниже — результат сверки R1–R6, а не повторного доверия к DOCX.

Статусы: `NOT_STARTED` | `PARTIAL` | `READY_FOR_VERIFICATION` | `DONE` | `BLOCKED` | `NOT_APPLICABLE`.

| ID | Requirement | Status | Evidence | Owner | Dependencies | Action |
| -- | ----------- | ------ | -------- | ----- | ------------ | ------ |
| W0-RECON | R1–R6 read-only audit vs `839f135` | DONE | Этот каталог, контракты агентов | Orchestrator | — | Закрыто |
| W0-DOCS | Audit control docs | DONE | `docs/audit/*` | Orchestrator | W0-RECON | Закрыто |
| P0-EXPORT | Полный backup learner state | DONE | `buildExport` пишет formatVersion 2: settings, portfolio, bookmarks, week progress, quiz attempts, learning events. Секретов нет | Agent B | — | Закрыто в Wave 1 |
| P0-IMPORT | Validate → version → migrate → preview → transaction → result | DONE | `migrateExport`, `previewImport`, `$transaction`. v1 не удаляет квизы и события | Agent B | P0-EXPORT | Закрыто в Wave 1 |
| P0-SECRETS | Не экспортировать password hash и session token | DONE | `buildExport` отдаёт только email/name | — | — | Сохранить инвариант в v2 |
| P0-IDOR | Portfolio update только своего пользователя | DONE | `updateMany` where `{ id, userId }` | Agent B | — | Закрыто |
| P0-DOCS | Архитектурные документы = текущий код | DONE | `PLATFORM.md` §A описывает текущий стек. Снимок `127ddb5` подписан как история. Регистрация недель в `course/index.ts` | Agent A | — | Закрыто |
| P0-CAPSTONE-UI | 32 недели + отдельный Capstone, без семантики «Неделя 33» | DONE | `weekLabel`: capstone → «Финальный проект». Глоссарий использует тот же helper | Agent A | — | Закрыто |
| P0-I18N | Русские подписи интерфейса | DONE | Хром: «Продолжить», «Сохранено», «Подготовка», «Что уже нужно», статусы портфолио по-русски. Названия модулей в curriculum не переводились | Agent A | — | Закрыто |
| P0-DEAD | Подтверждённый мёртвый код | DONE | `compact.ts` удалён. `course/legacy/README.md` помечает архив | Agent A | — | Закрыто |
| P0-RATELIMIT | In-memory rate limit не production-safe для нескольких инстансов | PARTIAL | `src/server/rate-limit.ts`, только login/register | Wave 6 | Доказанный use case | Не добавлять Redis в Wave 1 |
| P0-PROXY | Cookie presence = UX gate, сессия проверяется на сервере | DONE | `src/proxy.ts` смотрит cookie; `getSession()` проверяет hash и срок | — | — | Оставить границу явной в доке |
| P0-DEEPLINK | `?next=` после логина | NOT_STARTED | `proxy.ts` ставит `next`, auth его игнорирует | Wave 2 UX | — | Не в Wave 1, если не ломает data |
| C-W1 | Week 1: streaming vs normal, TTFT и total latency, retries в lab | DONE | Lab: stream false/true, TTFT, total, retry 429, без retry 401 | Agent C | — | Закрыто для Wave 1. Финальный проход ещё в C1 |
| C-W2 | Week 2: RU/EN/JSON/code tokens, temperature, top-p, variance | DONE | Студент измеряет четыре формы, temperature, top-p и пять повторов | Agent C | — | Закрыто для Wave 1 |
| C-W3 | Week 3: Prompt A vs B на dataset | DONE | Golden set, accuracy и cost в `week-03.ts`. Нет decision card и sources | Agent C | — | Добить card + source, не переписывать |
| C-W4 | Week 4: plain JSON vs schema-constrained, parse/schema/latency/tokens | DONE | A/B: prompt JSON vs `json_schema` strict, таблица отказов и токенов | Agent C | — | Закрыто для Wave 1 |
| C-SCHEMA | Course Quality Contract | NOT_STARTED | Поля живут в prose/`ContentBlock`, не в типах | Agent E | GATE 1 | Wave 2, shared `course/types.ts` |
| C-RUBRIC | ArtifactRubric first-class | NOT_STARTED | Только checklist | Agent E | C-SCHEMA | Wave 2 |
| C-ASSESS | Scenario/debug assessments, порог ~80% для сложных недель | PARTIAL | 5 MCQ, pass 70%. `scoreQuiz` хардкодит 70, action берёт `passScore` | Agent F / D | C-SCHEMA для расширения; drift чинится в D | Не ломать старый progress |
| C-SR | Spaced repetition | NOT_STARTED | Recall внутри недели, без `nextReviewAt` | Wave 5 P2 | — | Не считать recall scheduler-ом |
| C-RAG | Глубина RAG ingestion/chunking/eval | PARTIAL | Weeks 13–16 ready, ingestion в основном markdown | C4 | GATE 2 | Wave 3 |
| C-MCP | MCP threat model | PARTIAL | Week 18: host/client/server; каталог угроз тонкий | C5 | GATE 2 | Wave 3 |
| C-BUDGET | AgentBudget | PARTIAL | max steps/tokens/timeout в week 12; нет maxCost/toolBudget | C6 | GATE 2 | Wave 3 |
| C-DIST | at-most-once / exactly-once illusion названы | PARTIAL | at-least-once и DLQ есть в week 27 | C8 | GATE 2 | Wave 3 |
| C-MISSING | Local models, serving, fine-tune, routing, privacy taxonomy | NOT_STARTED | Почти нет в `course/` | M1–M5 | GATE 3 | Встраивать в существующие недели |
| T-CI | PR: typecheck, lint, test, build | DONE | `.github/workflows/ci.yml` | Agent D | — | Закрыто |
| T-CONTRACT | Unique ids/slugs, refs, no TODO/placeholder | DONE | `tests/curriculum-integrity.test.ts` | Agent D | — | Закрыто |
| T-EXPORT | Тесты export/import | DONE | `tests/export.test.ts`: v1→v2, секреты, preview. Запись в БД не покрыта интеграционным тестом | Agent B | P0-IMPORT | Схема закрыта |
| UX-NAV | Sidebar tree, breadcrumbs, mobile week nav | PARTIAL | Плоский список `hidden lg:block`, breadcrumbs нет | Agent G | GATE 1 capstone labels | Wave 2 |
| UX-NEXT | Где я и что дальше внутри недели | PARTIAL | Dashboard знает current week; вкладки без статуса | Agent G | — | Wave 2 |
| P1-ANALYTICS | Funnel по LearningEvent | NOT_STARTED | События пишутся, не читаются | Wave 5 | — | После curriculum |
| P4-MCP | Platform MCP server | NOT_STARTED | Нет | Wave 5 | Курс MCP | Не раньше |
| W6-REDIS | Redis/queue | NOT_APPLICABLE | Use case не доказан. Платформа — один процесс + Postgres | Wave 6 | Измеренная боль | Не ставить зависимость |
| W7-TUTOR | AI Tutor V1–V4 | NOT_STARTED | Нет rubrics/evals как контракта | Wave 7 | GATE 3+ | Research перед кодом |

Финальный `DONE` по implementation-пунктам ставит только Orchestrator после review и gate.
