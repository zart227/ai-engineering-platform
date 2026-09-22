# Wave 7 tutor

Baseline: `origin/main` `8620a62ec845fba2d834e4bd8e17d88fd13c38e7`. **GATE 7 closed for Tutor V1** (orchestrator sign-off Sep 2026). GATE FINAL is not done.

V1 is on `main`. `POST /api/tutor` (`src/app/api/tutor/route.ts`) calls `answerTutor` in `src/server/tutor.ts`. The theory tab renders `LessonTutor` per lesson (`src/components/lesson-tutor.tsx`). Provider routing lives in `src/server/llm.ts`. Tests: `tests/tutor.test.ts`.

## Provider split (job-pilot model)

Routine tasks use cloud Ollama (`get_simple_llm_provider`): `filter`, `scoring`, `chat`, `learning`, `edit_proposal`, `edit_reply`, and `tutor_v1`. Heavy tasks use OpenAI (`get_llm_provider`): `proposal`, `rubric_feedback`, `multi_week_context`, `long_generation`. Only `tutor_v1` is built; the heavy names are reserved and not implemented.

There is no silent cross-provider fallback. A routine call with no Ollama config returns `ollama_not_configured` (503). A heavy call with no OpenAI config returns `openai_not_configured`. Tutor V1 never calls OpenAI even when both keys are set.

Env keys are documented in `.env.example`: `OLLAMA_*` for the lesson tutor, `OPENAI_*` for future heavy flows.

## V1 behavior

Context is the current lesson’s teaching text plus the student question. `buildTutorPrompt` includes lesson title, objectives, teaching blocks, and `check.question`. It excludes `check.answer`, `practice.solution`, quiz answers, recall answers, other lessons, and other weeks. The route does not call `searchCourse` or read `feature-hash` vectors.

The route resolves the caller with `getSession()`; a cookie string alone is not enough. The owner is rate-limited at 20 requests per 15 minutes (`tutor:{userId}`). Logs carry `userId`, task, week slug, lesson id, and provider. They do not carry the question, lesson body, or email.

A reply that contains `practice.solution` is rejected (`reply_rejected`, 422). A reply that is the next hint text is allowed. The practice hint panel is unchanged: hints and solution still reveal through the existing panel without an attempt gate.

Browser smoke on current `main`: form renders on week 1 theory, Russian reply ~10s, no practice-solution leak (orchestrator browser run, Sep 2026).

## Research (T1–T5)

T1–T5 read-only research covers tutor architecture, why V1 must not use hash search, V3 rubric feedback shape, security limits, and a proposed 99-hint offline eval suite. Those rows and TutorContext separation are checked in `action-checklist.md`. GATE 7 is checked for V1 only.

## Deferred (V2–V4 out of scope for GATE 7)

- V2 citations: a retriever other than `feature-hash-v1` / `searchCourse` (T2).
- V3 rubric feedback on a real attempt history (T3).
- V4 multi-week context and long generation (heavy OpenAI tasks).
- The 99-hint golden eval job proposed in T5 (offline fixture + `solutionAbsent`; not in `npm test` yet).

Login and register rate-limit warnings no longer include the email (Wave 7 decision PR). Limits stay 8 and 5 attempts per 15 minutes.
