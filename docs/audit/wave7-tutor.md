# Wave 7 tutor

Baseline: `origin/main` `1592ea9abc595749c8d0c1661c014203cf15d0ba`. GATE 7 is not done. This change does not add a tutor endpoint.

No tutor ships until a provider exists. There is no LLM client in the repo: `package.json` has no model SDK, and `.env.example` has no model key. A provider is not enough on its own. The call still needs a session owner, a context without the answer key, logs without PII, a per-owner cap, and lesson text kept as data.

V1, when built, is the current lesson’s teaching text plus the student question. `TutorContext` does not include `practice.solution`, quiz answers, or recall answers. `check.answer` is not teaching text either. Only `check.question` belongs in that context.

V1 does not call `searchCourse`. `feature-hash-v1` cannot cite a paraphrased lesson. It is a token hash, and a paraphrase that shares no words with the passage does not land on that lesson.

The practice panel already reveals hints and the solution without an attempt. This change does not touch that panel.

V3 needs a real attempt. `ArtifactProgress` is a self-report: notes, URLs, and a completed checkbox, with no attempt history. The rubric lives in Git and is not shown on the artifact tab. V3 is not built here.

Evals later: 99 hint cases from the 33 practices (three hints each), and a failure if the solution string appears in the reply. No invented prices.

Login and register rate-limit warnings no longer include the email. Week 24 treats email as PII. The limits stay 8 and 5 attempts per 15 minutes.
