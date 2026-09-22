# Multi-Agent Task Graph

Baseline `839f135`. Параллелизм классифицирован по фактическим файлам, не по названиям задач.

## Dependency graph

```text
GATE 0  audit docs + ownership
        |
        +-- A Docs          SAFE_PARALLEL
        +-- B Data/Import   SAFE_PARALLEL
        +-- C Weeks 1-4     SAFE_PARALLEL     (контент, не types)
        +-- D Tests/CI      PARALLEL_WITH_COORDINATION
        |
      GATE 1
        |
        E Course Quality Schema     SEQUENTIAL / INTEGRATION_ONLY на course/types.ts
        |
        +-- F Assessments           PARALLEL_WITH_COORDINATION (после стабильных типов)
        +-- G Learning UX           SAFE_PARALLEL относительно E, после A (capstone labels)
        |
        Weeks 1-4 contract migration   SEQUENTIAL после E
        |
      GATE 2
        |
        C1..C10 week files          SAFE_PARALLEL между собой
        (не пересекать диапазоны файлов)
        |
        CR1..CR5                    SEQUENTIAL review
        |
      GATE 3
        |
        M1..M5 embed into existing weeks   SEQUENTIAL относительно C*
        (те же week-файлы, поэтому не параллельно с C*)
        |
      GATE 4
        |
        P1 Analytics, P2 Spaced repetition   SAFE_PARALLEL если разные таблицы/роуты
        P3 Semantic search                   SEQUENTIAL: только после use case
        P4 Platform MCP                      SEQUENTIAL: после недели MCP и security review
        |
      GATE 5
        |
        Wave 6 Redis/queue                   CONDITIONAL, иначе NOT_APPLICABLE
        |
        Wave 7 Tutor research then build     SEQUENTIAL после rubrics + evals + security
        |
      GATE FINAL
```

Нельзя одновременно менять `course/types.ts` и массово мигрировать недели.
Нельзя параллельно редактировать один `week-*.ts` из Wave 3 и Wave 4.

## Wave 1 tasks

### A — Documentation and consistency

- ID: W1-A
- TITLE: Привести docs и UI-термины к коду 32 недели + Capstone
- OWNER: Agent A
- PRIORITY: P0
- DEPENDENCIES: GATE 0
- OWNED FILES: см. `file-ownership.md`
- SHARED FILES: нет. `course/curriculum.ts` и тексты недель не трогать
- PARALLELISM: SAFE_PARALLEL
- CONFLICT RISK: Low. E2E-селекторы английских строк обновляет A, не D
- ACCEPTANCE CRITERIA:
  - `PLATFORM.md` описывает текущий modular monolith (Next, Prisma, Postgres, Git curriculum), исторический 6-week snapshot явно помечен как history
  - `content-schema.md` указывает регистрацию в `course/index.ts`
  - Capstone в UI не называется «Неделя 33»
  - Подтверждённые английские chrome-строки из R6 переведены
  - `course/weeks/compact.ts` удалён только если импортов нет
  - Curriculum weeks не изменены
- STATUS: DONE

### B — Data backup and import

- ID: W1-B
- TITLE: Export v2 и безопасный import
- OWNER: Agent B
- PRIORITY: P0
- DEPENDENCIES: GATE 0
- OWNED FILES: `src/server/export.ts`, `src/app/settings/settings-form.tsx`, точечно `src/app/actions/learn.ts`, `tests/export.test.ts`
- SHARED FILES: нет
- PARALLELISM: SAFE_PARALLEL
- CONFLICT RISK: Low
- ACCEPTANCE CRITERIA:
  - Payload v2 содержит formatVersion, exportedAt, settings, capstone, portfolio, notes, bookmarks, lesson/lab/exercise progress, answers, artifacts, week progress, quiz attempts, learning events
  - passwordHash и session token отсутствуют
  - v1 принимается и мигрируется
  - Preview до записи
  - Запись в одной транзакции
  - Результат с количествами
  - Portfolio update фильтрует `userId`
  - Тесты на схему, миграцию, preview и отсутствие секретов
- STATUS: DONE

### C — Foundation curriculum

- ID: W1-C
- TITLE: Weeks 1–4 эталонные эксперименты
- OWNER: Agent C
- PRIORITY: P0
- DEPENDENCIES: GATE 0. Не ждать schema Wave 2: глубина через lab/practice prose и таблицы, без новых полей типа
- OWNED FILES: `course/weeks/week-01.ts` … `week-04.ts`
- SHARED FILES: нет
- PARALLELISM: SAFE_PARALLEL
- CONFLICT RISK: Low
- ACCEPTANCE CRITERIA:
  - Week 1 lab: normal vs streaming, TTFT и total latency, retries/backoff
  - Week 2: RU vs EN vs JSON vs code tokenization; temperature и top-p; repeated generation variance
  - Week 3: сохранить dataset A vs B; добавить decision card и официальный source
  - Week 4: plain JSON vs schema-constrained; parse failures, schema failures, latency, tokens
  - Нет TODO/placeholder. Существующие рабочие уроки не выхолощены
- STATUS: DONE

### D — Testing and CI

- ID: W1-D
- TITLE: Curriculum integrity и CI baseline
- OWNER: Agent D
- PRIORITY: P0
- DEPENDENCIES: GATE 0. Не переписывать тесты под ещё не смерженный export v2 — это сделает Integration после B
- OWNED FILES: `tests/platform.test.ts`, `tests/completion.test.ts`, `tests/curriculum-integrity.test.ts`, `course/completion.ts` (только passScore drift), `.github/workflows/ci.yml`, `package.json` scripts
- SHARED FILES: `package.json` — единственный owner в этой wave: D
- PARALLELISM: PARALLEL_WITH_COORDINATION
- CONFLICT RISK: Medium, если D правит `e2e/learning-flow.spec.ts`. D этот файл не трогает
- ACCEPTANCE CRITERIA:
  - CI: typecheck, lint, test, build
  - Тесты: unique week ids и slugs, module refs, quiz answer bounds, нет TODO/placeholder в ready weeks, glossary related refs
  - `scoreQuiz` уважает `passScore`, а не зашитые 70
- STATUS: DONE

## Later waves (не запускать до gate)

| ID | TITLE | OWNER | PRIORITY | DEPENDENCIES | PARALLELISM | STATUS |
| -- | ----- | ----- | -------- | ------------ | ----------- | ------ |
| W2-E | Quality contract types | Integration + E | P0 | GATE 1 | INTEGRATION_ONLY | DONE |
| W2-F | Assessments weeks 1–4 | F | P1 | W2-E | SEQUENTIAL after schema | DONE |
| W2-G | Learning UX | G | P1 | W1-A | SAFE_PARALLEL | DONE |
| W3-C1..C10 | Curriculum deepen | C1–C10 | P0 | GATE 2 | SAFE_PARALLEL по файлам | DONE |
| W4-M1..M5 | Missing topics embed | M* | P1 | GATE 3 | SEQUENTIAL с теми же week files | NOT_STARTED |
| W5-P1 | Learning funnel | P1 | P1 | GATE 4 | SAFE_PARALLEL | NOT_STARTED |
| W5-P2 | Spaced repetition | P2 | P1 | GATE 4 | SAFE_PARALLEL | NOT_STARTED |
| W5-P3 | pgvector search | P3 | P2 | proven use case | SEQUENTIAL | NOT_STARTED |
| W5-P4 | Platform MCP | P4 | P2 | Week 18 + authz | SEQUENTIAL | NOT_STARTED |
| W6 | Redis/queue | — | — | measured need | CONDITIONAL | NOT_APPLICABLE until proven |
| W7 | AI Tutor | T* | P1 | rubrics, evals, security | SEQUENTIAL | NOT_STARTED |
| W8 | Final validation | reviewers | P0 | all gates | SEQUENTIAL | NOT_STARTED |

## Integration requests expected

Пока пусто. Агенты Wave 1 не должны писать в `course/types.ts`, `course/index.ts`, `course/curriculum.ts`, `prisma/schema.prisma`, `compose.yaml`.
