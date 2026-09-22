# File Ownership

Обновляется перед каждой implementation wave. У файла один implementation owner.

## Wave 1

| Agent | Owned files | Shared files | Conflict risk |
| ----- | ----------- | ------------ | ------------- |
| A Docs | `README.md`, `HANDOFF.md`, `docs/architecture/**`, `docs/curriculum/**`, `course/README.md`, `course/legacy/README.md`, удаление `course/weeks/compact.ts`, `src/lib/week-label.ts`, `src/components/week-workspace.tsx`, `src/components/app-header.tsx`, `src/components/save-field.tsx`, `src/components/decision-card.tsx`, `src/components/content-blocks.tsx`, `src/app/page.tsx`, `src/app/week/[slug]/page.tsx`, `src/app/project/page.tsx`, `src/app/project/project-form.tsx`, `src/app/projects/page.tsx`, `src/app/projects/portfolio-form.tsx`, `src/app/login/auth-form.tsx`, `src/app/search/search-client.tsx`, `src/app/bookmarks/page.tsx`, `e2e/learning-flow.spec.ts` (только строки, которые A переводит) | нет | Low. Не трогать `learn.ts`, `export.ts`, week-01..04, `package.json` |
| B Data | `src/server/export.ts`, `src/app/settings/settings-form.tsx`, `src/app/actions/learn.ts` (import + portfolio ownership + settings persist, без смены UX-копий других страниц), `tests/export.test.ts` | нет | Low. Не трогать curriculum и docs |
| C Foundation | `course/weeks/week-01.ts`, `course/weeks/week-02.ts`, `course/weeks/week-03.ts`, `course/weeks/week-04.ts` | нет | Low. Не менять `course/types.ts` |
| D Testing | `tests/platform.test.ts`, `tests/completion.test.ts`, `tests/curriculum-integrity.test.ts`, `course/completion.ts`, `.github/workflows/ci.yml`, `package.json` (только scripts) | `package.json` — owner D в этой wave | Medium, если задеть e2e или export tests. D не редактирует `e2e/` и `tests/export.test.ts` |
| Integration | Слияние веток, конфликты, прогон typecheck/lint/test/build | `course/types.ts`, `course/index.ts`, `course/curriculum.ts`, `prisma/schema.prisma`, `compose.yaml` — в Wave 1 изменений не планируется | Owner |

Ни один файл из колонки Owned не назначен двум агентам.

## Shared / high-conflict (по умолчанию Integration)

```text
course/types.ts
course/index.ts
course/curriculum.ts
prisma/schema.prisma
package.json          # исключение Wave 1: scripts принадлежат D
compose.yaml
course/completion.ts  # исключение Wave 1: passScore принадлежит D
общие layout/navigation — Wave 1 chrome принадлежит A; Wave 2 UX не стартует до GATE 1
```

## Wave 2

| Agent | Owned files | Shared files | Conflict risk |
| ----- | ----------- | ------------ | ------------- |
| E Schema | `course/types.ts`, `course/blocks.ts`, `docs/architecture/content-schema.md`, `tests/quality-contract.test.ts` | `course/types.ts` — единственный owner | Low. Недели не трогать |
| G UX | `src/components/week-workspace.tsx`, `src/components/week-nav.tsx`, `src/app/week/[slug]/page.tsx` | нет | Low. Не менять `week-label.ts` и тексты уроков |
| F Assessments | `course/weeks/week-01.ts` … `week-04.ts` | нет | Sequential после E. Не стартовать, пока типы не влиты |

## Wave 3 (содержание влито, CR открыт)

Один owner на файл. `course/glossary.ts`, `course/types.ts`, `course/index.ts`, `course/curriculum.ts` не редактировать: только INTEGRATION REQUEST.

| Agent | Owned files | Shared files | Conflict risk |
| ----- | ----------- | ------------ | ------------- |
| C1 | `course/weeks/week-01.ts` … `week-04.ts` | нет | Low. Финальный проход, без переписывания |
| C2 | `course/weeks/week-05.ts` … `week-10.ts` | glossary только через request | Low |
| C3 | `course/weeks/week-11.ts`, `week-12.ts` | нет | Low |
| C4 | `course/weeks/week-13.ts` … `week-16.ts` | нет | Low |
| C5 | `course/weeks/week-17.ts`, `week-18.ts` | нет | Low |
| C6 | `course/weeks/week-19.ts` … `week-23.ts` | нет | Low |
| C7 | `course/weeks/week-24.ts` … `week-26.ts` | нет | Low |
| C8 | `course/weeks/week-27.ts`, `week-28.ts` | нет | Low |
| C9 | `course/weeks/week-29.ts` … `week-32.ts` | нет | Low |
| C10 | `course/weeks/week-33.ts` | нет | Low |

Wave 4 не получает эти файлы, пока C* не завершены.

| Agent | Owned files | Shared files | Conflict risk |
| ----- | ----------- | ------------ | ------------- |
| C1 | `week-01.ts` … `week-04.ts` | types, если schema уже заморожена | Low после GATE 2 |
| C2 | `week-05.ts` … `week-10.ts` | glossary additions через integration request | Low |
| C3 | `week-11.ts` `week-12.ts` | — | Low |
| C4 | `week-13.ts` … `week-16.ts` | — | Low |
| C5 | `week-17.ts` `week-18.ts` | — | Low |
| C6 | `week-19.ts` … `week-23.ts` | — | Low |
| C7 | `week-24.ts` … `week-26.ts` | — | Low |
| C8 | `week-27.ts` `week-28.ts` | — | Low |
| C9 | `week-29.ts` … `week-32.ts` | — | Low |
| C10 | `week-33.ts` | — | Low |

Wave 4 не получает эти файлы, пока C* не завершены.
