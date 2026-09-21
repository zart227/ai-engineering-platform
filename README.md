# AI Engineering Platform

Репозиторий и приложение называются одинаково: `ai-engineering-platform`.

Интерактивная платформа самостоятельной программы:

**AI Engineer & Automation Developer**

От основ LLM и автоматизации до RAG, MCP, AI-агентов, multi-agent систем и production AI-продуктов.

Это не маркетинговый лендинг и не официальный курс FAANG+ Careers. Это учебник для разработчика: TypeScript/Node.js, практика 65-70%, каждая неделя заканчивается артефактом.

## Что внутри

- 18 модулей, 32 недели и capstone
- Module 1 (недели 1-4), Module 2 (недели 5-6) и Module 3 (недели 7-10) написаны полностью
- Недели 11-32 и capstone имеют обзор, уроки, лабу, практику, промпт, квиз и артефакт. Теория будет углубляться по модулям
- Аккаунты, PostgreSQL, заметки с автосохранением, прогресс, квизы, журнал проекта, портфолио, глоссарий, карта треков, экспорт JSON
- Docker Compose: приложение + Postgres на порту `43127`

## Стек

Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Prisma, PostgreSQL, Docker.

Контент курса лежит в Git (`course/`). Пользовательские данные в Postgres.

## Архитектура

```
Browser → ai-engineering-platform (Next.js :43127)
              → PostgreSQL (ai-engineering-platform-db)
```

Modular monolith. Redis, pgvector, очереди, n8n, MCP и AI Tutor появляются, когда у платформы есть реальная задача. Документация: `docs/architecture/PLATFORM.md`.

Карта 32 недель: `docs/curriculum/32-week-map.md`.

## Docker

```bash
cp .env.example .env
docker compose up -d
```

Сервисы:

- `ai-engineering-platform-app`
- `ai-engineering-platform-db`

Откройте http://127.0.0.1:43127

Образ собирается с `DOCKER_BUILD=1`, чтобы Next.js отдал `output: "standalone"`. Локальный `npm start` работает без standalone.

## Локальная разработка без Compose

Нужны Node 20+ и PostgreSQL.

```bash
cp .env.example .env
# поправьте DATABASE_URL при необходимости
npm install
npx prisma migrate dev
npm run dev
```

Порт `43127`. В некоторых cloud VM `next dev` плохо гидрирует. Тогда:

```bash
npm run build
npm start
```

## Переменные окружения

См. `.env.example`.

- `DATABASE_URL` - Postgres
- `AUTH_SECRET` - длинная случайная строка для cookie-подписи
- `APP_URL` - публичный URL. Если начинается с `https://`, cookie ставится как Secure
- `COOKIE_SECURE` - опционально `true`/`false`, перекрывает вывод из `APP_URL`

Секреты не коммитятся. Ключи LLM в эту платформу в MVP не входят: студенты вызывают модели в своих репозиториях.

## Auth

Регистрация, вход, выход, httpOnly-сессия, scrypt для пароля, лимит попыток. Смена пароля из сессии. Email-recovery нет: нет SMTP.

## Как добавить Module / Week / Lesson

1. Типы в `course/types.ts`
2. Неделя в `course/weeks/`
3. Подключить в `course/index.ts` и модуль в `course/curriculum.ts`
4. Глоссарий в `course/glossary.ts` при новых терминах
5. `npm test` и `npm run typecheck`

Не кладите учебный текст в Postgres без причины.

## Persistence и backup

Источник истины: PostgreSQL. Черновики textarea коротко живут в `localStorage` ключом `aep-draft:*`, пока сервер не подтвердил Saved.

Экспорт: Настройки → скачать JSON, или `GET /api/export` из сессии.
Импорт: Настройки → файл, схема валидируется Zod.

Бэкап БД: обычный `pg_dump` тома `ai-engineering-platform-pgdata`.

## Тесты

```bash
npm test
npx playwright test
```

E2E: регистрация → курс → неделя → заметка → лаба → квиз/артефакт → выход → вход.

## Production

- `output: "standalone"`
- non-root user в образе
- healthcheck `/api/health`
- не логируются пароли, cookie, API keys

Дежурному: `docs/architecture/PLATFORM.md`.
