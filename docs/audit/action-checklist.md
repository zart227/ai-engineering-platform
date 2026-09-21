# Action Checklist

Закрывает checkbox только Orchestrator после implementation, tests, review и integration.
Источник: multi-agent plan + сверка с `origin/main` `839f135`.

## Правила

- [x] Только Orchestrator закрывает checkbox после проверки.
- [x] Implementation agents работают в отдельных branch/worktree.
- [x] Перед wave есть file ownership matrix.
- [x] Shared files не редактируются параллельно без integration request.
- [ ] Следующая зависимая wave стартует только после GATE предыдущей.
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

- [ ] Agent A: current architecture docs, content schema, history, naming, UI terminology, Capstone label
- [ ] Agent B: export v2, полный backup, validated transactional import, preview, tests, portfolio ownership
- [ ] Agent C: Weeks 1–4 до эталона (experiments/metrics)
- [ ] Agent D: curriculum integrity, CI baseline
- [ ] Reviewer A: Platform/Data
- [ ] Reviewer B: Weeks 1–4
- [ ] Reviewer C: Docs/Tests/CI
- [ ] BLOCKER/MAJOR исправлены
- [ ] Integration: shared-file requests собраны
- [ ] typecheck + lint + tests + build
- [ ] GATE 1

## WAVE 2 — Quality System

- [ ] Agent E: Course Quality Contract, Experiment, Metric, FailureMode, ArtifactRubric, source/version
- [ ] Agent F: assessments глубже, без поломки старого progress
- [ ] Agent G: sidebar, breadcrumbs, 32+Capstone, navigation/a11y
- [ ] Shared course schema меняет только Integration
- [ ] Weeks 1–4 мигрированы на contract
- [ ] Contract tests
- [ ] Independent review
- [ ] GATE 2

## WAVE 3 — Curriculum Deepening

- [ ] C1 Weeks 1–4 final pass
- [ ] C2 Weeks 5–10
- [ ] C3 Weeks 11–12
- [ ] C4 Weeks 13–16
- [ ] C5 Weeks 17–18
- [ ] C6 Weeks 19–23
- [ ] C7 Weeks 24–26
- [ ] C8 Weeks 27–28
- [ ] C9 Weeks 29–32
- [ ] C10 Capstone
- [ ] Experiments / failure modes / debugging / metrics / error analysis / rubric / trade-offs
- [ ] CR1 progression
- [ ] CR2 duplication
- [ ] CR3 prerequisites
- [ ] CR4 depth
- [ ] CR5 portfolio value
- [ ] GATE 3

## WAVE 4 — Missing Topics (встраивание, не Week 34+)

- [ ] M1 Local models
- [ ] M2 Model serving fundamentals
- [ ] M3 Fine-tuning decision framework
- [ ] M4 Routing and cost
- [ ] M5 Reliability and privacy taxonomy
- [ ] GATE 4

## WAVE 5 — Platform as Lab

- [ ] P1 Learning analytics funnel
- [ ] P2 Spaced repetition «Сегодня повторить»
- [ ] P3 Semantic search только с реальным use case
- [ ] P4 Platform MCP после курса MCP
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
