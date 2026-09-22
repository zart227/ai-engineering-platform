# Wave 9 File Ownership — Group A (Critical Boundaries)

Created at Wave 9 preflight. One implementation owner per owned file. Shared files change only via Integration Agent or explicit integration request.

**Baseline SHA:** `fbddf51b0277462c1f6bee26669f5a027413d1ec` (`origin/main` at preflight).

**Parallel group:** A — runs before GATE 9A. Agents H1, H2, H3 may execute in parallel; no two agents edit the same owned file.

## Group A matrix

| Agent | Task | Owned files / areas | Shared / integration requests | Conflict risk |
| ----- | ---- | ------------------- | ----------------------------- | ------------- |
| **H1** | Student-safe content boundary + stale chunk cleanup | `src/server/course-index.ts`, new `src/server/student-visible-course.ts` (or equivalent serializer module), `src/server/semantic-search.ts` (stale delete on rebuild), `tests/content-boundary.test.ts`, `tests/semantic-search.test.ts` | **`src/server/mcp.ts`** — integration request only: wire H1 serializer into `course.search` hit text and prepare `course.lesson` handoff for H6; do not edit `mcp.ts` in H1 branch without reservation | **Medium** on serializer API contract; **Low** on owned files if H1 does not touch MCP |
| **H2** | Atomic auth rate limiter | `src/server/rate-limit.ts`, `tests/rate-limit-store.test.ts`, `tests/auth-rate-limit.test.ts`, optional migration/script for expired `RateLimitBucket` cleanup | **`src/server/auth.ts`** — integration request only if login/register call sites need signature or key changes | **Low** on owned files; **Medium** if auth.ts must change in same merge window |
| **H3** | Real E2E + database CI | `.github/workflows/ci.yml`, `e2e/learning-flow.spec.ts`, `playwright.config.ts`, CI helper scripts under `scripts/` or `e2e/` if added | **`compose.yaml`**, **`package.json`** test/e2e scripts — integration request only; **no product logic** changes except via separate finding | **Low** on workflow/e2e; **Medium** if CI needs compose or env contract changes |

## Per-agent acceptance (Group A)

### H1 — Student-safe Course Content Boundary

- Single student-visible serializer excludes: `check.answer`, `practice.solution`, quiz `answer`/`explanation`, `recall.answer`.
- `buildCourseChunkDescriptors()` uses safe serializer for `body` / embed source.
- Index rebuild deletes `CourseChunk` ids not in current descriptor set.
- Sentinel regression test (e.g. `CHECK-ANSWER-SECRET`) passes for serializer, `searchCourse()`, and MCP search payload after integration.

### H2 — Atomic Auth Rate Limiter

- Replace read-modify-write with atomic increment (SQL `UPDATE … RETURNING`, row lock, or conditional upsert).
- Concurrent test proves N parallel attempts → count N (not N−1).
- Expired bucket cleanup policy defined (helper or scheduled delete); dual email+IP limiter optional — defer with reason if not implemented.

### H3 — Real E2E + Database CI

- GitHub Actions service: PostgreSQL with pgvector; `prisma migrate deploy`.
- App serves on CI port (e.g. 43127); Playwright Chromium installed.
- Updated golden flow: register/login → week → lab → practice draft/hints → quiz pass → artifact **with repo URL** → week 100% → persistence after relogin; search/MCP/export-import smoke as specified in action plan.
- E2E is a **required** PR gate (job fails if E2E fails).

## Shared files — integration rules (Group A)

| File | Default owner during Group A | Rule |
| ---- | ---------------------------- | ---- |
| `src/server/mcp.ts` | Integration / H6 prep | H1 opens integration request; Integration merges serializer into search/lesson paths after H1 READY_FOR_INTEGRATION |
| `src/server/auth.ts` | Integration | H2 changes rate limiter only in owned module unless auth wiring requires coordinated merge |
| `compose.yaml`, `package.json` | Integration | H3 proposes CI env; Integration applies if dev/prod scripts affected |
| `src/app/actions/learn.ts`, `prisma/schema.prisma` | **Not Group A** | Reserved for H4/H5/H7/H8 |

## Dependency graph (Group A → GATE 9A)

```text
PRECHECK (this doc + wave9-baseline.md)
    |
    +-- H1 Student-safe boundary ----+
    +-- H2 Atomic rate limiter --------+--> GATE 9A
    +-- H3 Real E2E/DB CI -------------+
```

H6 (MCP conformance) depends on H1 merge but is **Group B**, not parallel with H2/H3 file conflicts.

## Conflict prevention checklist (orchestrator)

- [ ] Each agent branch/worktree named `cursor/wave9-h{N}-…-4a8b` (or orchestrator convention).
- [ ] No agent edits another agent’s owned file.
- [ ] Integration Agent serializes merges to `mcp.ts`, `auth.ts`, `package.json` as needed.
- [ ] New findings return to orchestrator as NEW FINDING — not silent scope expansion.

## Later waves (reference only — not Group A)

| Group | Agents | Gate |
| ----- | ------ | ---- |
| B — Learning integrity | H4, H5, H6, H7, H9 | GATE 9B |
| C — Hardening + docs | H8, H10 | GATE FINAL 2 |

Full matrix for Groups B/C: see `internal/ai-engineering-platform-multi-agent-action-plan-wave9.txt` §10.
