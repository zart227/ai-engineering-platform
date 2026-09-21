import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword, hashToken, createSessionToken } from "../src/server/crypto";
import { exportSchema } from "../src/server/export";
import { weeks } from "../course";

describe("crypto", () => {
  it("verifies a scrypt password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct-horse");
    assert.equal(await verifyPassword("correct-horse", stored), true);
    assert.equal(await verifyPassword("wrong-battery", stored), false);
  });

  it("hashes session tokens stably", () => {
    const token = createSessionToken();
    assert.equal(hashToken(token), hashToken(token));
    assert.notEqual(hashToken(token), hashToken(createSessionToken()));
  });
});

describe("export schema", () => {
  it("rejects garbage", () => {
    const parsed = exportSchema.safeParse({ version: 2 });
    assert.equal(parsed.success, false);
  });
});

describe("curriculum", () => {
  it("has 33 learnable units including capstone", () => {
    assert.equal(weeks.length, 33);
    assert.ok(weeks.every((week) => week.lessons.length >= 3));
    assert.ok(weeks.every((week) => week.quiz.questions.length >= 4));
    assert.ok(weeks.every((week) => week.artifact.checklist.length >= 1));
  });

  it("keeps unique slugs", () => {
    const slugs = weeks.map((week) => week.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("ships module 8 as full weeks", () => {
    const week = weeks.find((item) => item.slug === "agent-frameworks");
    assert.ok(week);
    assert.equal(week.status, "ready");
    assert.ok(week.lessons.length >= 5);
    assert.ok(week.prompts.length >= 2);
    assert.equal(week.decisionCards.length, 1);
    assert.ok(week.recall.length >= 2);
  });

  it("ships module 7 as full weeks", () => {
    const week = weeks.find((item) => item.slug === "mcp");
    assert.ok(week);
    assert.equal(week.status, "ready");
    assert.ok(week.lessons.length >= 5);
    assert.ok(week.prompts.length >= 2);
    assert.equal(week.decisionCards.length, 1);
    assert.ok(week.recall.length >= 2);
  });

  it("ships module 6 as full weeks", () => {
    const week = weeks.find((item) => item.slug === "agent-memory");
    assert.ok(week);
    assert.equal(week.status, "ready");
    assert.ok(week.lessons.length >= 5);
    assert.ok(week.prompts.length >= 2);
    assert.equal(week.decisionCards.length, 1);
    assert.ok(week.recall.length >= 2);
  });

  it("ships module 5 as full weeks", () => {
    for (const slug of ["embeddings", "pgvector", "rag", "advanced-rag"]) {
      const week = weeks.find((item) => item.slug === slug);
      assert.ok(week);
      assert.equal(week.status, "ready");
      assert.ok(week.lessons.length >= 5);
      assert.ok(week.prompts.length >= 2);
      assert.equal(week.decisionCards.length, 1);
      assert.ok(week.recall.length >= 2);
    }
  });

  it("ships module 4 as full weeks", () => {
    for (const slug of ["tool-calling", "agent-loop"]) {
      const week = weeks.find((item) => item.slug === slug);
      assert.ok(week);
      assert.equal(week.status, "ready");
      assert.ok(week.lessons.length >= 5);
      assert.ok(week.prompts.length >= 2);
      assert.equal(week.decisionCards.length, 1);
      assert.ok(week.recall.length >= 2);
    }
  });

  it("ships module 3 as full weeks", () => {
    for (const slug of ["automation-fundamentals", "n8n", "apis-webhooks", "ai-automation"]) {
      const week = weeks.find((item) => item.slug === slug);
      assert.ok(week);
      assert.equal(week.status, "ready");
      assert.ok(week.lessons.length >= 5);
      assert.ok(week.prompts.length >= 2);
      assert.equal(week.decisionCards.length, 1);
      assert.ok(week.recall.length >= 2);
    }
  });

  it("ships module 2 as full weeks", () => {
    for (const slug of ["professional-ai-coding", "ai-debug-test-review"]) {
      const week = weeks.find((item) => item.slug === slug);
      assert.ok(week);
      assert.equal(week.status, "ready");
      assert.ok(week.lessons.length >= 5);
      assert.ok(week.prompts.length >= 2);
      assert.equal(week.decisionCards.length, 1);
      assert.ok(week.recall.length >= 2);
    }
  });
});
