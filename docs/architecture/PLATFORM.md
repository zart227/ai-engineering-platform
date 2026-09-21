# AI Engineering Platform: аудит, архитектура, карта курса

Документ фиксирует фазы 0-2. Реализация начинается после этой спецификации.

Актуально на: 2026-09-21.

Проект: `ai-engineering-platform`.
Программа: **AI Engineer & Automation Developer**.
Подзаголовок: от основ LLM и автоматизации до RAG, MCP, AI-агентов, multi-agent систем и production AI-продуктов.

Язык продукта: русский. Код курса: TypeScript / Node.js, Python там, где это нужно AI Engineering.

---

## A. Current Architecture

Репозиторий на `main` (коммит `127ddb5`) это небольшой Next.js App Router учебник.

```
/
  course/                 типизированная программа, 6 недель
  src/app/                маршруты /, /week/[slug], /project
  src/components/         клиентский UI недель, прогресса, полей
  src/lib/progress*.ts    localStorage store
  package.json            name: ai-engineering-platform
```

Стек:

- Next.js 16.3.5, React 19.2, TypeScript strict
- Tailwind CSS 4, shadcn (Base UI / `base-nova`)
- Шрифты: Manrope + Source Serif 4, тёплая «бумажная» палитра
- Порт `43127`
- Контент в Git как TypeScript-объекты (`Week`, `Lesson`, `Exercise`, `PromptCard`)
- Алиасы `@/*` и `@course`

Слои сейчас:

1. **Content**: `course/week1.ts` … `week6.ts`, собираются в `course/index.ts`.
2. **Presentation**: Server Component страница недели отдаёт данные в клиентский `WeekView`.
3. **State**: модульный store + `useSyncExternalStore`. Ключ `cycle-course-v1`.
4. **Persistence**: только `localStorage`. Нет БД, auth, Docker, тестов, API.

Маршруты:

| URL | Назначение |
|-----|------------|
| `/` | обзор 6 недель, CTA «продолжить» |
| `/week/[slug]` | теория / практика / промпты / артефакт |
| `/project` | живой документ проекта |

Прогресс считается как доля отмеченных id: уроки + задания + чеклист артефакта. Артефакт-поле общее у недели и страницы проекта.

---

## B. Existing Features (сохранить)

Удачные решения, которые нельзя выкинуть при рефакторинге:

1. **Разделение `course/` и `src/`.** Контент не смешан с UI.
2. **Типизированный контент**, не CMS. Уроки ревьюятся в Git.
3. **Неделя как единица артефакта.** Неделя без результата не считается.
4. **Вкладки теории / практики / промптов / артефакта** и чеклист.
5. **Готовые промпты с Copy** и плейсхолдерами `{{…}}`.
6. **Сравнение «слабо / рабоче»** вместо корпоративного тона.
7. **Sidebar программы** с прогрессом недели.
8. **Previous / next** между неделями.
9. **Continue Learning** от первой незавершённой недели.
10. **Страница «Мой проект»** как журнал, не как маркетинг.
11. **Кастомные табы и чекбоксы** (plain button). Base UI Tabs/Checkbox на неделе ломали клики. Не возвращать их без проверки клика.
12. **Визуальный язык**: спокойный, для длинного чтения, без инфобизнес-градиентов.
13. **Порт 43127** и `npm start` на `0.0.0.0`.
14. **Русский, короткие предложения, без длинного тире.**
15. **Оригинальные материалы.** Не копировать FAANG+ Careers. Не называть это их курсом.

Старый 6-недельный продуктовый контент сохраняется в `course/legacy/` и частично встраивается в недели 5-6 и 29-31.

---

## C. Problems & Technical Debt

1. **Программа не про AI Engineering.** Сейчас 6 недель продуктового процесса для дизайнера/вайбкодера. Нужны 32 недели по трём трекам.
2. **Контент слишком тонкий.** Уроки 8-14 минут, нет лабораторий, квизов, hints/solutions, decision cards, spaced repetition, cost/security блоков.
3. **Нет пользователей.** `localStorage` не переживает смену браузера, не даёт аккаунт, экспорт слабый.
4. **Нет PostgreSQL, Prisma, Docker.** Нельзя учить fullstack persistence на самой платформе.
5. **Смешение UI и бизнес-логики прогресса** в `progress-provider.tsx`.
6. **Прогресс = чекбоксы.** Нет обязательности артефакта как отдельного правила completion, нет событий обучения, нет квизов.
7. **Нет auth, CSRF-модели сервера, rate limit, аудита.**
8. **Нет тестов** (unit / integration / E2E).
9. **Нет поиска, глоссария, закладок, карты треков, портфолио.**
10. **`next.config.ts` пустой.** Для Docker нужен `output: "standalone"`.
11. **Пакет `cn`** вместо обычного `clsx` + `tailwind-merge`. Оставляем, чтобы не трогать все UI-примитивы без нужды.
12. **`next dev` в cloud VM может не гидрировать.** Проверку UI делать через `next start` или Docker.
13. **HANDOFF запрещал auth/БД.** Этот запрет снят текущим ТЗ.

---

## D. Target Architecture

**Modular monolith.** Один Next.js-процесс, PostgreSQL, контент в Git. Никакого NestJS «для разделения». Redis, очередь, pgvector, n8n, MCP появляются только когда курс доходит до соответствующей недели и платформе это реально нужно.

```
Browser
  └─ ai-engineering-platform (Next.js 16, port 43127)
        ├─ App Router: страницы обучения, auth, dashboard
        ├─ Server Actions: мутации (прогресс, заметки, проект)
        ├─ Route Handlers: export JSON, health
        ├─ Content engine: course/* (Git)
        └─ Prisma Client
              └─ PostgreSQL (Docker volume)
```

Слои приложения:

| Слой | Где | Ответственность |
|------|-----|-----------------|
| Content | `course/` | программа, уроки, лабы, квизы. Без Prisma |
| Domain | `src/server/` | auth, progress, notes, projects, events |
| Persistence | `src/server/db.ts` + Prisma | пользовательские данные |
| UI | `src/components/` | оболочка, обучение, формы |
| Routes | `src/app/` | композиция, без бизнес-логики |

Эволюция (не ставить заранее):

```
сейчас: Next.js + PostgreSQL
week 14: pgvector
week 26: tracing/logs как учебный слой
week 27: Redis + queue, когда появится реальная задача
позже: AI Tutor, MCP, evals
```

Auth (self-hosted, без Clerk):

- Регистрация / вход / выход
- Пароль: Node `scrypt` + per-user salt (стандартная криптография Node.js, не самописные алгоритмы)
- Сессия: непрозрачный токен в httpOnly cookie `aep_session`, в БД хранится SHA-256 хеш
- SameSite=Lax, Secure в production
- Rate limit на login/register
- Смена пароля из сессии. Email-recovery в MVP нет: нет SMTP. Это честно описано в README.

Публичные маршруты: `/login`, `/register`, `/`.
Защищённые: обучение, заметки, проект, настройки, export.

Контент курса читается без логина (обзоры), прогресс пишется только с сессией.

---

## E. Database Schema

Курс **не** лежит в Postgres. В БД только пользовательские данные.

```
User 1──* Session
User 1──1 UserSettings
User 1──* Note
User 1──* Bookmark
User 1──1 CapstoneProject
User 1──* PortfolioProject
User 1──* LessonProgress
User 1──* LabProgress
User 1──* ExerciseProgress
User 1──* ExerciseAnswer
User 1──* ArtifactProgress
User 1──* WeekProgress
User 1──* QuizAttempt
User 1──* LearningEvent
```

Правила:

- `LessonProgress.completedAt IS NOT NULL` = урок прочитан.
- Неделя `completed` только если уроки + лаба + практика + **артефакт** + квиз (pass).
- Production seed не создаёт фейковый прогресс.
- Уникальность прогресса: `(userId, lessonId)` и аналоги.

Подробности полей: `prisma/schema.prisma`.

---

## F. Content Architecture

```
Course
  └─ Module (18 + capstone)
       └─ Week (32 + capstone)
            ├─ Overview
            ├─ Lessons[]          теория
            ├─ Lab                guided
            ├─ Practice           independent
            ├─ Prompts[]
            ├─ Quiz
            ├─ Artifact
            ├─ Recall[]           «Вспомни»
            └─ DecisionCards[]
```

Формат: TypeScript + хелперы блоков. Не MDX в первой версии: текущий движок уже так устроен, его расширяем.

Статусы недели:

- `ready`: полные тексты, можно проходить
- `outlined`: карта, обзор, названия уроков, лаба/квиз/артефакт описаны; теория пишется следующей итерацией

Первый релиз: Module 1 (weeks 1-4) `ready`. Остальные недели существуют в карте и в навигации с честным статусом, плюс рабочие обзор/лаба/практика/квиз/артефакт, чтобы платформа не была пустой оболочкой.

Блоки контента: `p`, `h`, `ul`, `ol`, `callout`, `prompt`, `compare`, `code`, `diagram`, `decision`, `cost`, `security`, `recall`, `check`, `reading`.

Цепочка урока:

PROBLEM → THEORY → HOW IT WORKS → NAIVE → LIMITATIONS → BETTER → LAB → PRACTICE → ARTIFACT → SELF-CHECK → COMMIT.

---

## G. Complete 32-Week Curriculum Map

См. `docs/curriculum/32-week-map.md` и `course/curriculum.ts`.

Сводка:

| Модуль | Недели | Часы (ориентир) | Артефакт модуля |
|--------|--------|-----------------|-----------------|
| 1 AI Fundamentals | 1-4 | 40 | LLM Playground |
| 2 AI-Assisted SE | 5-6 | 20 | AI development workflow |
| 3 Automation | 7-10 | 40 | AI Office Automation |
| 4 Tools & Agents | 11-12 | 24 | Personal AI Agent |
| 5 Embeddings & RAG | 13-16 | 44 | AI Knowledge Platform |
| 6 Memory | 17 | 12 | Persistent agent memory |
| 7 MCP | 18 | 12 | MCP Server на TypeScript |
| 8 Agent Frameworks | 19 | 10 | Сравнение SDK, один порт |
| 9 Multi-Agent | 20-21 | 24 | Deep Research System |
| 10 Planning | 22 | 10 | Planner + replanner |
| 11 HITL | 23 | 10 | Approval workflow |
| 12 Security | 24 | 12 | Attack then defend lab |
| 13 Evals | 25 | 12 | Evaluation pipeline |
| 14 Observability | 26 | 10 | Trace-first debugging |
| 15 Advanced automation | 27-28 | 24 | AI Automation Platform |
| 16 Product engineering | 29-30 | 24 | PRD + UX прототип |
| 17 Analytics | 31 | 12 | Analytics Agent |
| 18 Production | 32 | 16 | Production checklist |
| Capstone | после 32 | 40+ | AI SaaS в портфолио |

Итого ориентир: ~350 часов, практика 65-70%.

---

## H. Project Map

| # | Проект | Недели | Что должно работать |
|---|--------|--------|---------------------|
| 1 | LLM Playground | 1-4 | prompt, model, params, structured output, tokens, latency, cost, eval |
| 2 | AI Office Automation | 7-10 | event → n8n → classify → extract → route → DB → notify |
| 3 | Personal AI Agent | 11-12 | agent loop from scratch, tools, trace, budget |
| 4 | AI Knowledge Platform | 13-16 | ingest, chunk, embed, pgvector, rerank, citations, evals, Docker |
| 5 | MCP Server | 18 | tools/resources/prompts, TypeScript SDK, security notes |
| 6 | Multi-Agent Deep Research | 20-21 | supervisor + specialists, fact-check, citations, cost |
| 7 | AI Automation Platform | 27-28 | events, queue, agent+RAG+HITL |
| 8 | Analytics Agent | 31 | события, воронка, гипотезы |
| 9 | AI Software Development Team | 5-6, 22, capstone | spec-driven workflow как процесс |
| 10 | Capstone AI SaaS | после 32 | полный цикл idea → production |
| ∞ | **сама платформа** | сквозной | растёт вместе с курсом |

Страница «Мой проект» ведёт capstone / личный продукт.
Страница «Проекты» собирает портфолио из 1-10.

---

## I. Dependency Map

```
W1 env/API ─┬─ W2 how LLMs work ─┬─ W3 prompting ─ W4 context/JSON
            │                    └───────────────┘
            ├─ W5 AI coding ─ W6 debug/review
            └─ W7 automation ─ W8 n8n ─ W9 APIs ─ W10 AI workflows
                                           │
W4 + W5 ─ W11 tools ─ W12 agent loop ─┬─ W17 memory
                                      ├─ W18 MCP
                                      ├─ W19 frameworks
                                      └─ W13 embeddings ─ W14 pgvector ─ W15 RAG ─ W16 advanced RAG

W12 + W16 ─ W20 multi-agent ─ W21 research system
W12 ─ W22 planning ─ W23 HITL
W1 secrets + W12 tools + W15 RAG ─ W24 security
W3 eval prompts + W16 retrieval ─ W25 evals ─ W26 observability
W7-10 + W12 + W23 ─ W27 events ─ W28 agentic automation
W5 + research ─ W29 discovery ─ W30 UX ─ W31 analytics
все треки ─ W32 production ─ Capstone
```

Правило: новый модуль явно использует старые знания в блоке «Вспомни».

---

## J. Implementation Roadmap

### Phase 0. Audit (этот документ)

Готово.

### Phase 1. Architecture & schema

Типы контента, Prisma schema, Docker, auth-контракт.

### Phase 2. Curriculum map

`course/curriculum.ts` + 32-week markdown. Сразу полная карта названий уроков.

### Phase 3. Platform foundation

- Application shell, sidebar, breadcrumbs, dark mode
- PostgreSQL + Prisma + migrations + seed (без фейкового прогресса)
- Docker Compose: `ai-engineering-platform-app` + `ai-engineering-platform-db`
- Auth: register/login/logout
- Progress, autosave notes, project journal, artifacts
- Export/import JSON

### Phase 4. Learning UX

Теория, лабы, практика, hints/solutions, промпты, квизы, глоссарий, закладки, поиск, learning map, dashboard.

### Phase 5. Content

1. Module 1 полностью `ready`
2. Module 2 (недели 5-6) полностью `ready`: coding agents, AGENTS.md, отладка, тесты, ревью
3. Module 3 (недели 7-10) полностью `ready`: script/workflow/agent, n8n, webhook, AI Office Automation
4. Module 4 (недели 11-12) полностью `ready`: tool calling, цикл агента без фреймворка, Personal AI Agent
5. Module 5 (недели 13-16) полностью `ready`: cosine, pgvector, RAG, eval и AI Knowledge Platform
6. Module 6 (неделя 17) полностью `ready`: рабочая, эпизодическая и семантическая память, забвение строкой
7. Module 7 (неделя 18) полностью `ready`: MCP ревизии 2026-07-28, stdio, корень песочницы
8. Module 8 (неделя 19) полностью `ready`: сравнение своего цикла с двумя SDK, лимит шагов остаётся включённым
9. Module 9 (недели 20-21) полностью `ready`: один маршрут, потолок на роль, исследование с клапаном цитат
10. Module 10 (неделя 22) полностью `ready`: граф без цикла, checkpoint головы, пересборка хвоста и лимит replan
11. Module 11 (неделя 23) полностью `ready`: pending до side effect, право по имени инструмента, аудит
12. Module 12 (неделя 24) полностью `ready`: локальные фикстуры границ, документ не в system, секрет не в логе
13. Module 13 (неделя 25) полностью `ready`: held-out, детерминированный порог, прогон без ключа
14. Module 14 (неделя 26) полностью `ready`: след по request id, redaction, разбор падения по файлу
15. Module 15 (недели 27-28) полностью `ready`: очередь и DLQ, агент только на хвосте потока
16. Module 16 (недели 29-30) полностью `ready`: журнал фактов и PRD, пять кадров пути с отказом
17. Module 17 (неделя 31) полностью `ready`: воронка кодом, агент схемы отказывается без числа
18. Module 18 (неделя 32) полностью `ready`: runbook, видимый 429, монолит пока нет отдельной выкладки
19. Capstone (неделя 33) полностью `ready`: узкий срез, оценка, вторая итерация по наблюдению

После каждого блока: typecheck, lint, tests, build, визуальная проверка.

---

## K. Risks

| Риск | Тип | Митигация |
|------|-----|-----------|
| 32 тонкие недели вместо курса | педагогический | карта сразу, полные тексты только у готовых модулей, запрет «прочитайте документацию» как урока |
| Устаревание MCP / Agents SDK / n8n | педагогический | дата «Актуально на», ссылка на spec, не выдумывать API |
| localStorage потеряется при миграции | данные | одноразовый импорт `cycle-course-v1` в аккаунт |
| Auth самописный | безопасность | только Node crypto, httpOnly session, rate limit, без email-magic в MVP |
| Docker нет в dev-среде агента | технический | compose в репо; локально PostgreSQL + `npm start` |
| Base UI табы снова сломают клики | UX | native buttons, E2E клики |
| Hydration в `next dev` | технический | проверять `next start` |
| Перегруз микросервисами | архитектура | modular monolith, технологии по задаче |
| AI Tutor слишком рано | продукт | только контракт контекста, без LLM в MVP |
| Объём контента vs качество | педагогический | Все 33 недели ready: пять уроков, практика, порог качества в тестах |

Инженерные принципы курса (они же принципы платформы):

- Не агент, если хватит функции.
- Не n8n, если хватит скрипта.
- Не микросервис, если хватит модуля.
- Не vector search, если хватит SQL.
- Не RAG, если хватит контекста.
- Не LLM, если задача детерминированная.
