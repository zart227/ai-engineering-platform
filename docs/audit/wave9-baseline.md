# Wave 9 Baseline — Final Hardening & Learning Integrity

Preflight snapshot for Wave 9. Docs-only; no product code changes in this PR.

## Git baseline

| Reference | SHA | Notes |
| --------- | --- | ----- |
| Audit reference (`fbddf51`) | `fbddf51b0277462c1f6bee26669f5a027413d1ec` | Full re-audit baseline (2026-09-22) |
| `origin/main` at preflight | `fbddf51b0277462c1f6bee26669f5a027413d1ec` | **Same as audit reference** — no newer commits on main |
| Latest commit message | `docs(audit): close GATE FINAL after Wave 8 integration (#30)` | PR #30 |

Preflight commands: `git fetch origin`, `git rev-parse origin/main`.

## CI status (HEAD `fbddf51`)

| Run | Result | URL |
| --- | ------ | --- |
| CI on `main` push (HEAD) | **SUCCESS** | https://github.com/zart227/ai-engineering-platform/actions/runs/35750825444 |

Steps on this run: `npm ci`, `npx prisma generate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

**Gap:** Playwright E2E with real PostgreSQL + pgvector is **not** part of this workflow (see P0-3 below).

## GATE FINAL — reopen intent

The Sep 2026 full audit recommends **reopening GATE FINAL** until Wave 9 P0 findings are fixed and a new independent **GATE FINAL 2** sign-off completes.

- `action-checklist.md` still shows `[x] GATE FINAL` from Wave 8 PR #30 — **not unchecked in this preflight PR** (orchestrator-only change after Wave 9 work).
- Wave 9 preflight records **REOPEN intent** here; implementation agents must not treat the checklist checkbox as proof of production readiness while P0 code findings below remain open.
- **GATE 9A** and **GATE FINAL 2** are **not** marked in the checklist by this PR.

## P0 findings — re-verified on `fbddf51`

### P0-1 — Student-safe content boundary (Search/MCP)

**Status:** CONFIRMED OPEN (MAJOR)

Browser and Tutor correctly hide check answers; Search index does not.

| Surface | `check.answer` exposed? | Evidence |
| ------- | ------------------------ | -------- |
| Browser (`WeekClientPayload`) | No | `src/server/week-client-payload.ts` — `stripBlock` returns `{ type: "check", question }` only |
| Tutor context | No | `src/server/tutor.ts` — `case "check": return block.question` |
| Search index (`CourseChunk.body`) | **Yes** | `src/server/course-index.ts` line 24: `` `${block.question} ${block.answer}` `` |
| MCP `course.search` | Inherits index | Uses `searchCourse()` → indexed body text |

Related: `ensureCourseIndex()` upserts current chunks but does **not** delete stale `CourseChunk` rows removed from curriculum (`src/server/semantic-search.ts` — no delete pass after upsert loop).

**Wave 9 owner:** H1 (+ stale cleanup); H6 MCP lesson serializer after H1.

### P0-2 — Atomic Postgres auth rate limiter

**Status:** CONFIRMED OPEN (MAJOR)

`rateLimitPersisted` uses read-modify-write inside a transaction:

```typescript
// src/server/rate-limit.ts
const current = await tx.rateLimitBucket.findUnique({ where: { key } });
// ...
data: { count: current.count + 1 },
```

Concurrent requests can read the same `count` and lose increments. Sequential unit tests do not cover this race.

**Wave 9 owner:** H2.

### P0-3 — Real DB + pgvector + Playwright E2E in CI

**Status:** CONFIRMED OPEN (MAJOR)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| `.github/workflows/ci.yml` includes Playwright | **No** | Only typecheck, lint, test, build |
| E2E spec exists | Yes | `e2e/learning-flow.spec.ts` |
| E2E matches current server validation | **Stale** | Spec clicks «Артефакт готов» without GitHub URL (lines 41–43); server now requires repo URL (PR #29) |
| Golden week-completion flow in E2E | **Missing** | No practice complete → quiz pass → artifact with repo → week 100% path |

**Wave 9 owner:** H3.

## P1 findings — confirmed still present (Wave 9B scope)

| ID | Finding | Status on `fbddf51` | Evidence |
| -- | ------- | ------------------- | -------- |
| P1-1 | ArtifactRubric not in learning state / completion | OPEN | No `ArtifactAssessment` / rubric score model in schema; artifact completion is repo URL + user flag |
| P1-2 | Progressive solution unlock | OPEN | `week-workspace.tsx` — «Показать решение» available without hint/attempt sequence; `markSolutionAction` has no progression gate |
| P1-3 | MCP protocol conformance | OPEN | Custom wire in `src/server/mcp.ts`; no official SDK/conformance test evidence |
| P1-4 | Search stale chunk cleanup | OPEN | See P0-1 related note |
| P1-5 | Import semantic validation | OPEN | Audit §5.1 — percent bounds, curriculum id checks, post-restore recompute not fully enforced |

P1 items are **out of GATE 9A**; they start after H1–H3 merge and GATE 9A PASS.

## What Waves 0–8 keep (do not rework)

Wave 9 fixes boundaries and integrity gaps; it does **not** reopen closed foundation work.

| Wave | Verdict | Keep as closed |
| ---- | ------- | -------------- |
| **0** | DONE | Audit control docs, task graph, ownership, implementation log |
| **1** | DONE | Architecture docs, export/import v2, Weeks 1–4 measurements, CI baseline |
| **2** | DONE | Course Quality Contract, Weeks 1–4 rubrics/quizzes, sidebar/breadcrumbs UX |
| **3** | DONE | All 33 units: objectives, experiments, failure modes, metrics, rubrics, sources, 8 quiz questions |
| **4** | DONE | Local models, serving, fine-tuning decision framework, routing, privacy taxonomy (weeks 2, 10, 25, 32) |
| **5 / 5.1** | DONE | User-week funnel analytics, spaced repetition, hash search (pgvector), Platform MCP tools, export v3 + RecallReview |
| **6** | NOT_APPLICABLE | Redis/queue — no measured async use case |
| **7** | PASS (V1 only) | Tutor V1: session owner, current-lesson context, fail-closed routing; V2–V4 deferred |
| **8** | Improvements landed | Security/performance reviews (#7–#29), Postgres auth rate limit (#28), server-side completion validation (#29), integration review 17/17 |

**Wave 5 content-boundary correction:** Wave 5 delivered search/MCP successfully, but the new audit’s P0-1 is a **correction** to indexing — not a rollback of Wave 5 scope.

## Wave 9A critical gate (preview — not closed here)

GATE 9A requires H1 + H2 + H3 acceptance before Wave 9B starts:

- Hidden answers absent from Search/MCP/student-visible serializers
- Stale chunks removed on index rebuild
- Atomic rate limiter under concurrency + cleanup policy
- Playwright + Postgres + pgvector mandatory in CI

See `wave9-ownership.md` for Group A file ownership.

## Related audit docs (unchanged in this PR)

- `implementation-status.md` — last Wave 8 sync at `5fa4fc6`; stale Week 3 note flagged for H10
- `action-checklist.md` — GATE FINAL `[x]` retained; GATE 9A / GATE FINAL 2 not added
- `implementation-log.md` — Wave 8 GATE FINAL close recorded at `5fa4fc6`; Wave 9 log entries deferred to implementation PRs

## Next steps (orchestrator)

1. Publish Group A ownership matrix (`wave9-ownership.md`) and spawn H1/H2/H3 in parallel worktrees.
2. Do not start Wave 9B until GATE 9A PASS.
3. After Wave 9 completion, independent review suite → GATE FINAL 2 (orchestrator-only checklist update).
