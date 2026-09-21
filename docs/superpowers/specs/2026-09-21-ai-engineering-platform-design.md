# Design spec: AI Engineering Platform v2

Date: 2026-09-21
Repo: `ai-engineering-platform`

## Problem

The current app is a 6-week product-process tutorial with browser-only state. The owner needs a self-paced AI Engineering + Automation + Product platform: 32 weeks, accounts, progress, artifacts, and a path to production systems.

## Approach chosen

Modular monolith: Next.js App Router + PostgreSQL + Prisma + Docker Compose. Course content in Git. User data in Postgres. First content drop: Module 1 complete, remaining weeks mapped and learnable at outlined depth.

Rejected: (1) keep localStorage-only, (2) split a NestJS API now, (3) Clerk-hosted auth that fights Docker-first local learning.

## UX

Interactive textbook. Sidebar, breadcrumbs, progress, previous/next, dark mode, copyable prompts, collapsible hints, hidden solutions, quizzes, artifact checklist. Not a marketing landing.

## Auth

Email + password, scrypt, database sessions, httpOnly cookie. No email recovery in MVP.

## Out of MVP

Live AI Tutor, Redis, n8n in compose, pgvector, queues. Architecture leaves seams. Those land when a week requires them and the platform itself needs the capability.
