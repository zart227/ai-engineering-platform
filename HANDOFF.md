# Handoff for the next AI

This document is a complete briefing. Read it before changing the repo. The product language is Russian. The owner prefers short human copy and no em dash (длинное тире «—»).

## Who this is for

User: Artur Zainullin (email in Cursor run metadata: zarg227@yahoo.com).

He is a fullstack developer: ~1 year PHP Laravel + Vue, 4 years before that as an ERP developer. He uses Cursor every day but “by intuition”, mostly to generate/edit code. He wants a system: briefs, context, review, not just “write a function”.

He applied to the paid course **AI for product designers** by FAANG+ Careers (Zhenya Trofimov + Lesha Svirida / Леша Свиридо). That course is aimed mainly at product designers (also vibe-coders and PMs). Zhenya asked him in Telegram to describe himself so they can judge if the course is relevant.

## How this repo started

This was an empty new-project session. The first user message was typed in the **English keyboard layout while meaning Russian**:

`ye;yj yfgbcfnm jndtn yf cjj,otybt/ tot z [jntk yfgbcfnm ghj bb/ z [jxe ,jktt 'abrnbdyj tuj bcgjkmpjdfnm/ epyfnm rfr vj;yj`

Decoded: «нужно написать ответ на сообщение. еще я хотел написать про ии. я хочу более эффективно его использовать. узнать как можно».

He attached a Telegram screenshot:

- Zhenya (FAANG+ Careers): saw the application for the AI course, asked who he is, what he does, what experience he has, to see if the course is relevant.
- Artur already sent: fullstack 1 year, PHP Laravel + Vue, 4 years ERP, uses Cursor.

I drafted a follow-up Telegram reply (experience + AI motivation + honest question whether the course is more for designers). User asked: no em dashes, more human, and to include experience. That draft was chat-only. Telegram MCP was not connected. **Do not send anything to Telegram unless he explicitly asks again.**

Then he sent: `https://faang.careers/ai-course вот сам курс. возьми от туда программу. и составь сам курс с теорией и практикой`.

That is the actual product in this repo: a **self-paced clone of the public 6-week outline**, with original lessons, exercises, and prompts. It is **not** official FAANG+ Careers material. Do not copy their landing copy verbatim. Do not pretend this is their paid course (no homework review, no live calls, no Screen Gallery Pro).

Later he asked to put the app in its own folder, then to rename the folder because `course` did not describe the course.

## What the course is

Public name in the UI: **AI Engineering Platform**.  
Course inside it is still the 6-week process «Цикл».  
Repo: `artur-zainullin/ai-engineering-platform`. App lives at the repo root (`course/` + `src/`).

One week = one stage of a product process. The student does everything on **one personal project** (work pain, internal tool, or a small service). Each week ends with an artifact. Progress and notes live in `localStorage` key `cycle-course-v1`. Nothing is sent to a server. No auth, no database.

### Week map (from faang.careers/ai-course + their blog, rewritten)

| Week | Slug | Stage | Artifact |
|------|------|--------|----------|
| 1 | `fundament` | Models, prompts, context, Cursor rules, token cost | Personal AI operating system |
| 2 | `discovery` | Narrow the problem, facts, short PRD | Problem brief + evidence log + PRD v1 |
| 3 | `ideation` | Diverge 15 ideas, 3 directions, “council of agents” | Chosen direction + why not the others |
| 4 | `validation` | Prototype the core path, same rubric for people and the model | Prototype + test notes + go/iterate/kill |
| 5 | `implementation` | Ship a live URL via Cursor/GitHub/Vercel | Live URL + README + debt list |
| 6 | `analytics` | Events, tiny funnel, portfolio case | Events + funnel note + 1-page case |

Tools mentioned in the original public program (we teach the process, not a tool zoo): Claude, ChatGPT, Gemini, Perplexity, Cursor, Claude Code, Codex, MCP, Figma, Notion, NotebookLM, Figma Make / Stitch / Claude Design, GitHub, Vercel, Cloudflare, PostHog, Mixpanel.

Content is written so a **developer on Cursor** can take it (Artur’s case), not only a designer in Figma. Keep that. Do not turn it into a generic ChatGPT prompt pack.

### Copy rules the user already enforced

- Russian, spoken, short sentences.
- No long dash `—`.
- No lorem, no “welcome to your app”.
- Ready-to-copy prompts with `{{placeholders}}`.
- Human vs model examples as «слабо / рабоче», not corporate.

## Repo layout

```
/
  README.md
  HANDOFF.md
  course/                 # weeks, lessons, exercises, prompts
  src/                    # Next.js app
  package.json            # name: ai-engineering-platform
  src/app/                # /, /week/[slug], /project
  src/lib/progress.ts
  src/lib/progress-store.ts
  src/components/         # week-view, save-fields, progress-provider, …
  src/components/ui/
  scripts/
```

Do not nest the app in `ai-product-process/` again. The repo name is the app name.

### Important files

- Course data: `course/week1.ts` … `week6.ts`
- Week UI: `src/components/week-view.tsx` (`WeekView` + `WeekPanels`)
- Checkboxes / notes: `src/components/save-fields.tsx` (`DoneRow` is a plain `<button>`, not shadcn Checkbox)
- Progress: `src/lib/progress-store.ts` + `useSyncExternalStore` in `progress-provider.tsx`
- Routes: `src/app/page.tsx`, `src/app/week/[slug]/page.tsx`, `src/app/project/page.tsx`

Routes:

- `/` program overview
- `/week/fundament` `/week/discovery` `/week/ideation` `/week/validation` `/week/implementation` `/week/analytics`
- `/project` living document for the student’s project + artifacts

Tabs on a week page: Теория, Практика, Промпты, Артефакт. State is `useState` in `WeekView`, panels switch in `WeekPanels`. Each panel has `data-panel="theory|practice|prompts|artifact"`.

## Stack

Next.js 16.3.5 App Router, React 19, TypeScript, Tailwind 4, shadcn (Base UI primitives). Port **43127** (not 3000). `npm start` binds `0.0.0.0`.

```bash
npm install
npm run build
npm start
```

Dev: `npm run dev` (same port). See the bug below before relying on `next dev` in this cloud environment.

## Bugs already found and fixed (do not regress)

1. **shadcn/Base UI Tabs and Checkbox did not respond to clicks** in the week UI. Nested `<label>` + Base UI checkbox also double-toggled. Replaced with plain buttons. Do not put Base UI Tabs back into `week-view.tsx` without testing real clicks.

2. **`next dev` in this cloud VM often does not hydrate.** HMR websocket `ws://127.0.0.1:43127/_next/hmr` fails (`ERR_INVALID_HTTP_RESPONSE`). Result: SSR HTML looks fine, links work, React `onClick` does not. Symptom: tab underline might look focused but `aria-selected` and `data-panel` never change. **Preview/verify with `npm run build && npm start`**, not `next dev`. Confirmed working in production: tabs switch, prompts copy, artifact checklist, “прочитал” checkbox, header progress %.

3. Inner folder was `ai-product-process/`. Repo is now `ai-engineering-platform` and the Next.js app lives at the repo root.

## What another AI should / should not do

Should:

- Keep one-project-through-six-weeks design.
- Keep original educational text (not scraped FAANG lesson videos; we never had those).
- If adding content, match the week’s artifact.
- Verify UI by actually clicking tabs and checkboxes, preferably against `next start`.
- Speak to the user in Russian, casually, no em dash.

Should not:

- Add auth, a database, or a second component library.
- Call this the official FAANG+ Careers course.
- Open a PR unless the user asks (this session is a new-project flow).
- Send Telegram messages.
- Estimate calendar time.
- Reintroduce Base UI tabs for the week page without a real browser click test.

## Current runtime expectation

App is served from the repo root on `http://127.0.0.1:43127`. Branch: `main`.
