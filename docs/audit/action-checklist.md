# Action Checklist

Закрывает checkbox только Orchestrator после implementation, tests, review и integration.
Источник: multi-agent plan + сверка с `origin/main` `839f135`.

## Правила

- [x] Только Orchestrator закрывает checkbox после проверки.
- [x] Implementation agents работают в отдельных branch/worktree.
- [x] Перед wave есть file ownership matrix.
- [x] Shared files не редактируются параллельно без integration request.
- [x] Следующая зависимая wave стартует только после GATE предыдущей.
- [x] Параллелизм только для независимых задач.

## WAVE 0 — Reconnaissance

- [x] R1 Platform Auditor
- [x] R2 Curriculum Auditor
- [x] R3 AI Engineering Reviewer
- [x] R4 Automation Reviewer
- [x] R5 Testing & Quality Auditor
- [x] R6 UX Auditor
- [x] Orchestrator объединил findings с фактическим кодом
- [x] `docs/audit/implementation-status.md`
- [x] `docs/audit/action-checklist.md`
- [x] `docs/audit/multi-agent-task-graph.md`
- [x] `docs/audit/file-ownership.md`
- [x] Dependency graph и Wave 1 определены
- [x] GATE 0: findings согласованы с `origin/main` `839f135`

## WAVE 1 — Foundation

- [x] Agent A: current architecture docs, content schema, history, naming, UI terminology, Capstone label
- [x] Agent B: export v2, полный backup, validated transactional import, preview, tests, portfolio ownership
- [x] Agent C: Weeks 1–4 до эталона (experiments/metrics)
- [x] Agent D: curriculum integrity, CI baseline
- [x] Reviewer A: Platform/Data
- [x] Reviewer B: Weeks 1–4
- [x] Reviewer C: Docs/Tests/CI
- [x] BLOCKER/MAJOR исправлены
- [x] Integration: shared-file requests собраны
- [x] typecheck + lint + tests + build
- [x] GATE 1

## WAVE 2 — Quality System

- [x] Agent E: Course Quality Contract, Experiment, Metric, FailureMode, ArtifactRubric, source/version
- [x] Agent F: недели 1–4, 8 вопросов, passScore 70 сохранён
- [x] Agent G: sidebar по модулям, breadcrumbs, mobile disclosure, a11y name
- [x] Shared course schema меняет только Integration
- [x] Weeks 1–4 мигрированы на contract
- [x] Contract tests
- [x] Independent review
- [x] GATE 2

## WAVE 3 — Curriculum Deepening

Содержание C1–C10 влито в #15. Ревью и правки указателей, которые не попали в squash, в этой ветке. Сравнение одного агента с несколькими остаётся на неделе 20.

- [x] C1 Weeks 1–4 final pass
- [x] C2 Weeks 5–10
- [x] C3 Weeks 11–12
- [x] C4 Weeks 13–16
- [x] C5 Weeks 17–18
- [x] C6 Weeks 19–23
- [x] C7 Weeks 24–26
- [x] C8 Weeks 27–28
- [x] C9 Weeks 29–32
- [x] C10 Capstone
- [x] Experiments / failure modes / debugging / metrics / error analysis / rubric / trade-offs
- [x] CR1 progression
- [x] CR2 duplication
- [x] CR3 prerequisites
- [x] CR4 depth
- [x] CR5 portfolio value
- [x] GATE 3

## WAVE 4 — Missing Topics (встраивание, не Week 34+)

Эти шаги были на ветке после squash #15 и в `main` не вошли.

- [x] M1 Local models
- [x] M2 Model serving fundamentals
- [x] M3 Fine-tuning decision framework
- [x] M4 Routing and cost
- [x] M5 Reliability and privacy taxonomy
- [ ] GATE 4

## WAVE 5 — Platform as Lab

Сделано от `origin/main` `5820ae5`. P3 и P4 не начинались.

- [x] P1 Learning analytics funnel
- [x] P2 Spaced repetition «Сегодня повторить»
- [x] P3 Semantic search только с реальным use case
- [x] P4 Platform MCP после курса MCP
- [ ] GATE 5

## WAVE 6 — Async (conditional)

- [ ] Use case доказан, иначе Redis/queue не добавлять
- [ ] GATE 6

## WAVE 7 — AI Tutor

- [ ] T1–T5 research
- [ ] TutorContext отделён от SolutionContext
- [ ] GATE 7

## WAVE 8 — Final Validation

- [ ] Security, performance, cost reviewers
- [ ] Red team, student simulation, fresh clone
- [ ] Full validation
- [ ] GATE FINAL

## Definition of Done — Week

- [ ] Theory complete; no placeholders
- [ ] Objectives проверяемы
- [ ] Guided lab + independent Core practice
- [ ] Controlled experiment, если применимо
- [ ] Failure/debugging, если применимо
- [ ] Artifact воспроизводим
- [ ] Metric для AI/automation
- [ ] Error analysis
- [ ] Architecture/trade-off
- [ ] Assessment
- [ ] ArtifactRubric
- [ ] Sources/version
- [ ] Independent reviewer

## Definition of Done — Wave

- [ ] Output contract от всех assigned agents
- [ ] BLOCKER/MAJOR исправлены
- [ ] Shared files интегрированы централизованно
- [ ] Full typecheck/lint/tests/build
- [ ] Docs, checklist, implementation-log обновлены
- [ ] Orchestrator подтвердил GATE
