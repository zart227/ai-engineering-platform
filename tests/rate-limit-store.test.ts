import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { cleanupExpiredRateLimitBuckets, rateLimitPersisted } from "../src/server/rate-limit";
import { installRateLimitStoreMock } from "./helpers/rate-limit-store-mock";

const WINDOW_MS = 15 * 60 * 1000;

describe("rateLimitPersisted", () => {
  let mock = installRateLimitStoreMock();

  beforeEach(() => {
    mock.restore();
    mock = installRateLimitStoreMock();
  });

  afterEach(() => {
    mock.restore();
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

  it("allows exactly the limit under concurrent attempts and cannot be bypassed by races", async () => {
    const key = "login:concurrent@example.com";
    const limit = 8;
    const attempts = 24;

    const results = await Promise.all(
      Array.from({ length: attempts }, () => rateLimitPersisted(key, limit, WINDOW_MS)),
    );

    const allowed = results.filter((result) => result.ok);
    const blocked = results.filter((result) => !result.ok);

    assert.equal(allowed.length, limit);
    assert.equal(blocked.length, attempts - limit);
    assert.equal(mock.buckets.get(key)?.count, limit);
  });

  it("serializes concurrent register attempts to the exact limit", async () => {
    const key = "register:concurrent@example.com";
    const limit = 5;
    const attempts = 15;

    const results = await Promise.all(
      Array.from({ length: attempts }, () => rateLimitPersisted(key, limit, WINDOW_MS)),
    );

    assert.equal(results.filter((result) => result.ok).length, limit);
    assert.equal(mock.buckets.get(key)?.count, limit);
  });
});

describe("cleanupExpiredRateLimitBuckets", () => {
  let mock = installRateLimitStoreMock();

  beforeEach(() => {
    mock.restore();
    mock = installRateLimitStoreMock();
  });

  afterEach(() => {
    mock.restore();
  });

  it("deletes only buckets whose resetAt is before the cutoff", async () => {
    const activeKey = "login:active@example.com";
    const expiredKey = "login:expired-cleanup@example.com";

    await rateLimitPersisted(activeKey, 8, WINDOW_MS);
    await rateLimitPersisted(expiredKey, 8, WINDOW_MS);

    const expiredBucket = mock.buckets.get(expiredKey);
    assert.ok(expiredBucket);
    expiredBucket.resetAt = new Date(Date.now() - 60_000);

    const deleted = await cleanupExpiredRateLimitBuckets(new Date());
    assert.equal(deleted, 1);
    assert.ok(mock.buckets.has(activeKey));
    assert.equal(mock.buckets.has(expiredKey), false);
  });
});
