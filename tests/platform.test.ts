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
});
