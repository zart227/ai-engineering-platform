# Content schema

Course content lives in Git as typed TypeScript. User data lives in PostgreSQL.

## Identifiers

- Module: `m01` … `m18`, `capstone`
- Week slug: stable kebab-case, see curriculum map
- Lesson id: `{slug}-l{n}` e.g. `environment-llm-api-l1`
- Lab id: `{slug}-lab`
- Practice id: `{slug}-practice`
- Prompt id: `{slug}-p{n}`
- Quiz id: `{slug}-quiz`
- Artifact id: `{slug}-artifact`
- Decision card id: `{slug}-d{n}`
- Glossary id: kebab term

## Week.status

- `ready`: theory is complete enough to learn without leaving the platform
- `outlined`: overview, lab, practice, quiz, artifact, and lesson bodies exist, but later iterations will deepen theory

A week in the UI is never an empty card with «изучите тему сами».

## Completion

```
weekPercent = mean([
  lessonsCompleted / lessonsTotal,
  labComplete ? 1 : 0,
  practiceComplete ? 1 : 0,
  artifactComplete ? 1 : 0,
  quizPassed ? 1 : 0,
])
weekComplete = all of the above are done
```

Artifact is mandatory. Checking lessons only cannot yield 100%.

## Quality contract

TypeScript keeps these fields optional so an `outlined` week still loads. For `status: "ready"` the quality test requires:

- `learningObjectives`
- `experiments`
- `failureModes`
- `metrics`
- `artifactRubric`
- `sources`
- `contentVersion`
- `lastReviewedAt`
- at least 8 quiz questions

These stay optional even on a ready week:

- `securityNotes`
- `privacyNotes`
- `costNotes`
- `productionNotes`

When a rubric is present, its `criteria` weights are positive numbers and sum to 100. A ready week must have a rubric.

`sources` use `CourseSource`: `title`, `url`, `kind` (`official-docs`, `paper`, or `reference`), and `checkedAt`.

Weeks are still registered in the `weeks` array in `course/index.ts`.

## Adding a week

1. Add metadata in `course/curriculum.ts` if new.
2. Create `course/weeks/week-NN-slug.ts` exporting `Week`.
3. Register the week in the `weeks` array in `course/index.ts`.
4. Add glossary terms if you introduce new words.
5. Add recall questions that point at previous week ids.
6. Run `npm test` and `npm run typecheck`.
