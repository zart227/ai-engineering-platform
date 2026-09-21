# Implementation Status

Baseline: `origin/main` `839f135` (совпадает с HEAD на старте Wave 0).
Аудит-документы описывают тот же коммит. Расхождения с кодом ниже — результат сверки R1–R6, а не повторного доверия к DOCX.

Статусы: `NOT_STARTED` | `PARTIAL` | `READY_FOR_VERIFICATION` | `DONE` | `BLOCKED` | `NOT_APPLICABLE`.

| ID | Requirement | Status | Evidence | Owner | Dependencies | Action |
| -- | ----------- | ------ | -------- | ----- | ------------ | ------ |
| W0-RECON | R1–R6 read-only audit vs `839f135` | DONE | Этот каталог, контракты агентов | Orchestrator | — | Закрыто |
| W0-DOCS | Audit control docs | DONE | `docs/audit/*` | Orchestrator | W0-RECON | Закрыто |
| P0-EXPORT | Полный backup learner state | PARTIAL | `src/server/export.ts`: есть notes, capstone, progress, bookmarks, settings в payload; нет PortfolioProject, WeekProgress, QuizAttempt, LearningEvent; bookmarks и settings не импортируются | Agent B | — | Export v2 |
| P0-IMPORT | Validate → version → migrate → preview → transaction → result | PARTIAL | Zod + `$transaction` есть; preview, migration v1→v2 и отчёт по сущностям отсутствуют. Импорт сразу пишет | Agent B | P0-EXPORT | Пайплайн + тесты |
| P0-SECRETS | Не экспортировать password hash и session token | DONE | `buildExport` отдаёт только email/name | — | — | Сохранить инвариант в v2 |
| P0-IDOR | Portfolio update только своего пользователя | NOT_STARTED | `savePortfolioAction` обновляет по `id` без `userId` (`src/app/actions/learn.ts`) | Agent B | — | `where: { id, userId }` |
| P0-DOCS | Архитектурные документы = текущий код | PARTIAL | `docs/architecture/PLATFORM.md` всё ещё описывает 6-недельный localStorage snapshot `127ddb5`. `content-schema.md` ссылается на несуществующий `course/weeks/index.ts` | Agent A | — | Отделить history от current |
| P0-CAPSTONE-UI | 32 недели + отдельный Capstone, без семантики «Неделя 33» | PARTIAL | Контент: `id: 33`, `slug: capstone`. UI пишет «Неделя 33». Шапка: «32 недели» | Agent A | — | Подпись Capstone в UI |
| P0-I18N | Русские подписи интерфейса | PARTIAL | Остатки: Continue Learning, Saved, Setup, Prerequisites, planned/in-progress/done | Agent A | — | Хром UI, не тексты уроков |
| P0-DEAD | Подтверждённый мёртвый код | PARTIAL | `course/weeks/compact.ts` нигде не импортируется. `course/legacy/` исключён из tsconfig | Agent A | — | Удалить `compact.ts`, legacy пометить архивом |
| P0-RATELIMIT | In-memory rate limit не production-safe для нескольких инстансов | PARTIAL | `src/server/rate-limit.ts`, только login/register | Wave 6 | Доказанный use case | Не добавлять Redis в Wave 1 |
| P0-PROXY | Cookie presence = UX gate, сессия проверяется на сервере | DONE | `src/proxy.ts` смотрит cookie; `getSession()` проверяет hash и срок | — | — | Оставить границу явной в доке |
| P0-DEEPLINK | `?next=` после логина | NOT_STARTED | `proxy.ts` ставит `next`, auth его игнорирует | Wave 2 UX | — | Не в Wave 1, если не ломает data |
| C-W1 | Week 1: streaming vs normal, TTFT и total latency, retries в lab | PARTIAL | Теория есть, lab с `stream: false`, без измерения | Agent C | — | Эталонный lab |
| C-W2 | Week 2: RU/EN/JSON/code tokens, temperature, top-p, variance | PARTIAL | Temperature grid есть; язык, top-p и явная дисперсия — нет | Agent C | — | Эксперимент с таблицей |
| C-W3 | Week 3: Prompt A vs B на dataset | DONE | Golden set, accuracy и cost в `week-03.ts`. Нет decision card и sources | Agent C | — | Добить card + source, не переписывать |
| C-W4 | Week 4: plain JSON vs schema-constrained, parse/schema/latency/tokens | PARTIAL | Zod/repair есть, сравнительного замера нет | Agent C | — | A/B lab |
| C-SCHEMA | Course Quality Contract | NOT_STARTED | Поля живут в prose/`ContentBlock`, не в типах | Agent E | GATE 1 | Wave 2, shared `course/types.ts` |
| C-RUBRIC | ArtifactRubric first-class | NOT_STARTED | Только checklist | Agent E | C-SCHEMA | Wave 2 |
| C-ASSESS | Scenario/debug assessments, порог ~80% для сложных недель | PARTIAL | 5 MCQ, pass 70%. `scoreQuiz` хардкодит 70, action берёт `passScore` | Agent F / D | C-SCHEMA для расширения; drift чинится в D | Не ломать старый progress |
| C-SR | Spaced repetition | NOT_STARTED | Recall внутри недели, без `nextReviewAt` | Wave 5 P2 | — | Не считать recall scheduler-ом |
| C-RAG | Глубина RAG ingestion/chunking/eval | PARTIAL | Weeks 13–16 ready, ingestion в основном markdown | C4 | GATE 2 | Wave 3 |
| C-MCP | MCP threat model | PARTIAL | Week 18: host/client/server; каталог угроз тонкий | C5 | GATE 2 | Wave 3 |
| C-BUDGET | AgentBudget | PARTIAL | max steps/tokens/timeout в week 12; нет maxCost/toolBudget | C6 | GATE 2 | Wave 3 |
| C-DIST | at-most-once / exactly-once illusion названы | PARTIAL | at-least-once и DLQ есть в week 27 | C8 | GATE 2 | Wave 3 |
| C-MISSING | Local models, serving, fine-tune, routing, privacy taxonomy | NOT_STARTED | Почти нет в `course/` | M1–M5 | GATE 3 | Встраивать в существующие недели |
| T-CI | PR: typecheck, lint, test, build | NOT_STARTED | Скрипты в `package.json` есть, `.github/workflows` нет | Agent D | — | Wave 1 |
| T-CONTRACT | Unique ids/slugs, refs, no TODO/placeholder | PARTIAL | Уникальные slugs и плотность контента в `tests/platform.test.ts` | Agent D | — | `curriculum-integrity` |
| T-EXPORT | Тесты export/import | PARTIAL | Один негативный кейс `version: 2` | Agent B | P0-IMPORT | Round-trip схемы |
| UX-NAV | Sidebar tree, breadcrumbs, mobile week nav | PARTIAL | Плоский список `hidden lg:block`, breadcrumbs нет | Agent G | GATE 1 capstone labels | Wave 2 |
| UX-NEXT | Где я и что дальше внутри недели | PARTIAL | Dashboard знает current week; вкладки без статуса | Agent G | — | Wave 2 |
| P1-ANALYTICS | Funnel по LearningEvent | NOT_STARTED | События пишутся, не читаются | Wave 5 | — | После curriculum |
| P4-MCP | Platform MCP server | NOT_STARTED | Нет | Wave 5 | Курс MCP | Не раньше |
| W6-REDIS | Redis/queue | NOT_APPLICABLE | Use case не доказан. Платформа — один процесс + Postgres | Wave 6 | Измеренная боль | Не ставить зависимость |
| W7-TUTOR | AI Tutor V1–V4 | NOT_STARTED | Нет rubrics/evals как контракта | Wave 7 | GATE 3+ | Research перед кодом |

Финальный `DONE` по implementation-пунктам ставит только Orchestrator после review и gate.
