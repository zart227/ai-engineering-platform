import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { loginUser, registerUser } from "../src/server/auth";
import { prisma } from "../src/server/db";
import { logWarn } from "../src/server/logger";

const RATE_LIMIT_ERROR = "Слишком много попыток. Подождите немного.";
const LOGIN_EMAIL = "Login-Rate-Limit@Example.com";
const REGISTER_EMAIL = "Register-Rate-Limit@Example.com";

const originalConsole = {
  warn: console.warn,
  info: console.info,
  error: console.error,
};

function captureConsole() {
  const lines: string[] = [];
  const push = (...args: unknown[]) => {
    lines.push(args.map((item) => String(item)).join(" "));
  };
  console.warn = push;
  console.info = push;
  console.error = push;
  return lines;
}

function restoreConsole() {
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.error = originalConsole.error;
}

afterEach(() => {
  restoreConsole();
});

describe("auth rate-limit logs", () => {
  it("does not write an email field", () => {
    const lines = captureConsole();
    logWarn("login_rate_limited", { email: LOGIN_EMAIL });
    logWarn("register_rate_limited", { email: REGISTER_EMAIL, userId: "user-1" });
    const text = lines.join("\n");
    assert.equal(text.includes(LOGIN_EMAIL), false);
    assert.equal(text.includes(LOGIN_EMAIL.toLowerCase()), false);
    assert.equal(text.includes(REGISTER_EMAIL), false);
    assert.match(text, /"email":"\[redacted\]"/);
    assert.match(text, /"userId":"user-1"/);
  });

  it("logs a blocked login without the email and still stops at 8 attempts", async () => {
    const originalFindUnique = prisma.user.findUnique;
    let lookups = 0;
    prisma.user.findUnique = (async () => {
      lookups += 1;
      return null;
    }) as typeof prisma.user.findUnique;
    const lines = captureConsole();
    try {
      const allowed = [];
      for (let attempt = 0; attempt < 8; attempt += 1) {
        allowed.push(await loginUser({ email: `  ${LOGIN_EMAIL}  `, password: "not-the-password" }));
      }
      const blocked = await loginUser({ email: LOGIN_EMAIL, password: "not-the-password" });
      assert.equal(lookups, 8);
      assert.ok(allowed.every((result) => !result.ok && result.error === "Неверный email или пароль."));
      assert.deepEqual(blocked, { ok: false, error: RATE_LIMIT_ERROR });
      const text = lines.join("\n");
      assert.equal(text.includes(LOGIN_EMAIL), false);
      assert.equal(text.includes(LOGIN_EMAIL.toLowerCase()), false);
      assert.match(text, /\{"level":"warn","message":"login_rate_limited"\}/);
    } finally {
      prisma.user.findUnique = originalFindUnique;
    }
  });

  it("logs a blocked registration without the email and still stops at 5 attempts", async () => {
    const lines = captureConsole();
    const input = { email: REGISTER_EMAIL, name: "Ada", password: "short" };
    const allowed = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      allowed.push(await registerUser(input));
    }
    const blocked = await registerUser(input);
    assert.ok(allowed.every((result) => !result.ok && result.error === "Пароль не короче 8 символов."));
    assert.deepEqual(blocked, { ok: false, error: RATE_LIMIT_ERROR });
    const text = lines.join("\n");
    assert.equal(text.includes(REGISTER_EMAIL), false);
    assert.equal(text.includes(REGISTER_EMAIL.toLowerCase()), false);
    assert.match(text, /\{"level":"warn","message":"register_rate_limited"\}/);
  });
});
