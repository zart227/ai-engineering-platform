import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { rateLimitPersisted } from "../src/server/rate-limit";
import { installRateLimitStoreMock } from "./helpers/rate-limit-store-mock";

const WINDOW_MS = 15 * 60 * 1000;

describe("rateLimitPersisted", () => {
  let mock = installRateLimitStoreMock();

  afterEach(() => {
    mock.restore();
    mock = installRateLimitStoreMock();
  });

  it("blocks after the limit and keeps the bucket across calls", async () => {
    const key = "login:persisted@example.com";
    const allowed = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      allowed.push(await rateLimitPersisted(key, 8, WINDOW_MS));
    }
    const blocked = await rateLimitPersisted(key, 8, WINDOW_MS);

    assert.ok(allowed.every((result) => result.ok));
    assert.deepEqual(blocked, { ok: false, remaining: 0 });
    assert.equal(mock.buckets.get(key)?.count, 8);
  });

  it("blocks register keys after five attempts", async () => {
    const key = "register:trim-persisted@example.com";
    const allowed = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      allowed.push(await rateLimitPersisted(key, 5, WINDOW_MS));
    }
    const blocked = await rateLimitPersisted(key, 5, WINDOW_MS);

    assert.ok(allowed.every((result) => result.ok));
    assert.deepEqual(blocked, { ok: false, remaining: 0 });
    assert.equal(mock.buckets.get(key)?.count, 5);
  });

  it("resets the bucket after the window expires", async () => {
    const key = "login:expired@example.com";
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await rateLimitPersisted(key, 8, WINDOW_MS);
    }
    const blocked = await rateLimitPersisted(key, 8, WINDOW_MS);
    assert.equal(blocked.ok, false);

    const bucket = mock.buckets.get(key);
    assert.ok(bucket);
    bucket.resetAt = new Date(Date.now() - 1_000);

    const reopened = await rateLimitPersisted(key, 8, WINDOW_MS);
    assert.deepEqual(reopened, { ok: true, remaining: 7 });
    assert.equal(mock.buckets.get(key)?.count, 1);
  });
});
