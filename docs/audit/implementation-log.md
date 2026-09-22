# Implementation Log

## Wave 0

Agents:

- R1 Platform Auditor
- R2 Curriculum Auditor
- R3 AI Engineering Reviewer
- R4 Automation Reviewer
- R5 Testing & Quality Auditor
- R6 UX / Learning Experience Auditor

Parallel tasks:

- Шесть read-only аудитов одновременно. Код не менялся.

Completed:

- Оба DOCX прочитаны целиком.
- `git fetch`: HEAD = `origin/main` = `839f135`, working tree clean. Baseline аудита совпал с кодом.
- Findings сверены с `export.ts`, Prisma schema, `learn.ts`, `package.json`.

Changed files:

- `docs/audit/implementation-status.md`
- `docs/audit/action-checklist.md`
- `docs/audit/multi-agent-task-graph.md`
- `docs/audit/file-ownership.md`
- `docs/audit/implementation-log.md`
- `.gitignore` (`.worktrees/`)

Tests:

- Не запускались: Wave 0 read-only, `node_modules` на старте отсутствовал.

Review findings:

- Export не покрывает portfolio, week progress, quiz attempts, learning events. Bookmarks и settings не импортируются.
- Import без preview и миграции версий.
- Portfolio update без `userId` (IDOR).
- Weeks 1, 2, 4 не содержат обязательных измерений. Week 3 близка к эталону.
- CI отсутствует. Контракт curriculum покрыт частично.
- UI называет capstone «Неделей 33» и оставляет английские chrome-строки.
- Redis/queue не нужны, пока нет измеренного use case.
- `PLATFORM.md` устарел относительно Postgres-платформы.

Fixes:

- Нет кодовых фиксов в Wave 0. Исправления назначены Wave 1.

Integration:

- Документы аудита пишет Orchestrator на `cursor/platform-quality-waves-df0e`.

Remaining:

- Wave 1 implementation.

Next Wave:

- Wave 1: A docs, B data, C weeks 1–4, D tests/CI. Параллельно, разные файлы.

## Wave 1

Agents:

- A Documentation and UI terminology (`cursor/wave1-docs-df0e`)
- B Export/import (`cursor/wave1-data-df0e`)
- C Weeks 1–4 (`cursor/wave1-foundation-df0e`)
- D Tests and CI (`cursor/wave1-testing-df0e`)
- Reviewers A, B, C after merge

Parallel tasks:

- Docs, backup, foundation weeks, and CI on separate worktrees. No shared-file edits.

Completed:

- Architecture docs match the Postgres app. Capstone in the UI is «Финальный проект».
- Export formatVersion 2 covers settings, portfolio, bookmarks, week progress, quiz attempts, and learning events. Secrets stay out.
- Import previews, then writes in one transaction. A v1 file does not delete quiz attempts or learning events. A v2 file replaces them.
- Portfolio update requires the owner's userId.
- Weeks 1–4 measure streaming latency, tokenization, prompt A/B, and schema-constrained output.
- CI runs typecheck, lint, test, and build. Curriculum integrity tests cover ids, slugs, module refs, and quiz bounds.

Changed files:

- See merge `d432361` plus the integration fixes: glossary label, `scoreQuiz` passScore wiring, v1 history preservation.

Tests:

- `npm test`: 37 passed
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass
- Browser: register, dashboard, capstone page, week 1 lab, settings import copy, glossary

Review findings:

- MAJOR: glossary still printed «Неделя {id}». Fixed with `weekLabel`.
- MAJOR found by integration: v1 import would delete quiz and event history. Fixed with `importReplacesHistory`.
- MINOR: `submitQuizAction` ignored `scoreQuiz` passScore. Wired through.
- Reviewers A and B: no BLOCKER/MAJOR remaining.
- Redis not added.

Fixes:

- Glossary capstone label, history replace only for formatVersion 2, quiz pass threshold uses one function.

Integration:

- Fast-forward of the four branches onto `cursor/platform-quality-waves-df0e`.

Remaining:

- Course Quality Contract, deeper assessments, sidebar/breadcrumbs. Not Redis.

Next Wave:

- Wave 2.

## Gate 1

PASS.

Foundation is green, docs describe the current app, backup/import was reviewed, weeks 1–4 meet the measurement bar.

## Wave 2

Agents:

- E Course quality schema (`cursor/wave2-schema-df0e`)
- G Learning UX (`cursor/wave2-ux-df0e`)
- F Weeks 1–4 contract and quizzes (`cursor/wave2-assess-df0e`), после схемы
- Read-only reviewer после слияния

Parallel tasks:

- Схема и UX одновременно, разные файлы. Оценки недель 1–4 стартовали после вливания типов.

Completed:

- Опциональный контракт: objectives, experiments, failure modes, metrics, rubric, sources, contentVersion, lastReviewedAt, security/privacy/cost notes.
- Тест: если рубрика есть, веса суммируются в 100; источники https.
- Недели 1–4 заполнены. Квиз по 8 вопросов. Порог 70 не менялся.
- Навигация недели группирует модули, показывает крошки и компактный список на узком экране.

Changed files:

- `course/types.ts`, `docs/architecture/content-schema.md`, `tests/quality-contract.test.ts`
- `src/components/week-nav.tsx`, `src/components/week-workspace.tsx`
- `course/weeks/week-01.ts` … `week-04.ts`

Tests:

- `npm test` после схемы и UX: 40 passed
- Контракт и integrity после недель 1–4: passed
- typecheck и lint: passed
- Авторизованный HTML `/week/environment-llm-api`: «Курс», «Неделя 1», «Финальный проект», ноль «Неделя 33», `aria-label="Программа"`, класс `lg:hidden`

Review findings:

- Независимый просмотр: BLOCKER/MAJOR/MINOR нет.

Fixes:

- Нет.

Integration:

- Три ветки влиты в `cursor/platform-quality-waves-df0e`.

Remaining:

- Недели 5–33 без полей контракта и с квизом из 5 вопросов.
- Глубокие темы RAG, MCP, агентов, автоматизации, продукта.
- Платформенные фичи: аналитика, интервальное повторение, поиск, MCP, очередь, тьютор. Redis не добавлялся.

Next Wave:

- Wave 3: непересекающиеся диапазоны недель, только после этого gate.

## Wave 3 — содержание влито, ревью нет

Ветка `cursor/wave3-curriculum-df0e` от `origin/main` `117e6a9`. Десять диапазонов недель влиты без конфликтов: C1 `a16ac91`, C2 `e18de6c`, C3 `8e4dcd1`, C4 `0f13f23`, C5 `12f234d`, C6 `4bbd254`, C7 `47310cb`, C8 `fac4c48`, C9 `7e8dd3b`, C10 `f8eba66`.

- Все 33 недели: 8 вопросов, `passScore` 70, рубрика из 4 критериев с суммой 100.
- Capstone: две карточки решения, `cap-d1` и `cap-d2`. Тест модулей 11–capstone ждёт хотя бы одну карточку.
- Глоссарий не менялся в том коммите. Термины добавлены ниже, уже после squash #15.
- CR1–CR5 в том коммите ещё не были закрыты.

## После squash #15

`origin/main` `5820ae5` совпадает с деревом `1e860ad`. Коммит `93c5640` и Wave 4 в squash не вошли.

Ревью: указатели недель 20, 25, 29, 31. Длинное тире убрано из недели 4. Capstone: таблица slug недели, артефакт, берёте или не-цель (`cap-a7`). Глоссарий: agent-budget, recall-at-k, tool-shadowing, at-most-once, at-least-once, exactly-once, pii, percentile.

Wave 4, без новых недель:

- Неделя 2: «Один prompt, API и local».
- Неделя 10: «Маршрут модели».
- Неделя 25: «Таблица рычагов», веса не обучают.
- Неделя 32: «Один запрос, пять подряд, таймаут».
- Неделя 24 уже различает reliability, security, safety, privacy.

## Gate 3

PASS. Сравнение одного агента и нескольких остаётся на неделе 20.

## Gate 4

PASS. Темы встроены в существующие недели. Вторая карточка решения не добавлялась.

Tests:

- `npm test`: 40 passed
- `npm run typecheck`: passed
- `npm run lint`: passed после удаления worktree

## Gate 2

PASS.

Схема стабильна и необязательна, недели 1–4 на контракте, тесты есть, документ обновлён. Массовая миграция недель 5–33 разрешена и не начата в этом проходе.

## Wave 5

База: `origin/main` `5820ae588fc5466cdeaffdb96cc05637178c0b01`, PR #15. Ветка `cursor/wave5-learning-lab-df0e`.

На базе `5820ae5` были поля контракта недели и `recall`, и не было шагов Wave 4: в глоссарии не было `agent-budget` и `recall-at-k`, в неделе 2 не было шага локальной модели, в неделе 10 не было шага маршрута модели, чекбоксы Wave 4 и GATE 4 были открыты. После merge с Wave 4 эти шаги, термины и GATE 4 в дереве есть.

P1. На дашборде воронка только по строкам текущего `userId`: `lesson_started`, `lesson_completed`, `exercise_started` вместе с `lab_completed`, `quiz_passed`, `artifact_completed`. Пусто, если событий нет. Новый тип события не добавлялся.

P2. «Сегодня повторить» показывает recall недель, по которым уже есть прогресс. Срок лежит в `RecallReview.nextReviewAt`. Пока человек не нажмёт «Повторил», просроченный вопрос остаётся. Capstone подписан «Финальный проект».

Не делалось: P3, P4, Redis, очередь, недели после 33, смена `passScore`. Расписание повторения не входит в export v2 и импорт его не удаляет.

Tests:

- `npm test`: 51 passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `NODE_ENV=production npm run build`: passed
- Миграция `20260922025000_recall_review` добавила таблицу. Колонки `LearningEvent` те же, `QuizAttempt` не чистился.
- Chrome на `next start`: пустая воронка, числа пяти шагов, «Ответ» и «Повторил», пропущенный вопрос capstone остаётся, строки «Неделя 33» нет. Ширина 1280 и 390.

## Gate 5

Историческая пометка волны 5 для P1 и P2. После доработки воронки, поиска и MCP чекбокс GATE 5 снова открывали. Закрытие записано в проверке `1592ea9` ниже.

## Wave 5.1

База: `origin/main` `f56b403f4c79dde58170a8357b2ad7fbc3459fae`.

В том проходе GATE 4 и GATE 5 не закрывали. Закрытие — проверка `1592ea9` ниже.

M1–M4 углублены в неделях 2, 32, 25 и 10. M5 не переписывалась. Воронка считает user-week по порядку шагов. Export formatVersion 3 возит `RecallReview`. Поиск ученика пишет векторы в pgvector. MCP: `POST /api/mcp`.

Тема берётся из `UserSettings.theme`. Логин возвращает на внутренний `next`.

## Gate 0

PASS.

Условия: DOCX прочитаны, repository сверен с `origin/main`, findings объединены, task graph, dependencies, ownership и состав Wave 1 зафиксированы.

## Gate 4, Gate 5, Gate 5.1

PASS на `origin/main` `1592ea9abc595749c8d0c1661c014203cf15d0ba` (PR #2, CI SUCCESS). Wave 6 не запускалась. Redis не добавлялся.

Проверка: `npx tsx --test tests/**/*.test.ts` — 74 passed, 0 failed. В том числе `tests/gate-topics.test.ts`, `tests/export.test.ts`, `tests/funnel.test.ts`, `tests/mcp.test.ts`, `tests/theme-boot.test.ts`, `tests/internal-path.test.ts`, `tests/quality-contract.test.ts`.

Контракт готовой недели по-прежнему падает, если убрать рубрику, источники, цели, эксперимент, failure mode, метрику, `contentVersion` или `lastReviewedAt` (`tests/quality-contract.test.ts`, «rejects a ready week that drops a core field»).

## Wave 7 tutor V1

GATE 7 и GATE FINAL не закрыты. Redis не добавлялся.

Тьютор одного урока вызывает cloud Ollama. Тяжёлые задачи (proposal, rubric feedback, multi-week context, long generation) названы на стороне OpenAI и не собраны. Контекст — учебный текст текущего урока и вопрос. Панель подсказок практики не менялась.

## Wave 8 checklist reconciliation

База: `origin/main` `cac6473` (PRs #7–#25). `docs/audit/action-checklist.md` WAVE 8 разбит на точные строки: security/performance/cost MAJORs, red-team restore и UI fixes, student simulation, fresh clone — отмечены по коду. Открыто: client `completed` boolean, `P0-RATELIMIT` in-memory, full validation, GATE FINAL. GATE 7 не трогали.

Проверка: `npm test` — 164/164 pass.
