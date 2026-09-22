import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const compose = readFileSync(join(process.cwd(), "compose.yaml"), "utf8");
const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

describe("compose.yaml", () => {
  it("does not ship a hardcoded Postgres password", () => {
    assert.doesNotMatch(compose, /aep_dev_password/);
    assert.match(
      compose,
      /POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD:\?Set POSTGRES_PASSWORD in \.env before docker compose up\}/,
    );
  });

  it("binds Postgres to localhost only", () => {
    assert.match(compose, /127\.0\.0\.1:5432:5432/);
    assert.doesNotMatch(compose, /\n\s*-\s*"5432:5432"/);
  });

  it("builds the app DATABASE_URL from POSTGRES_PASSWORD", () => {
    assert.match(
      compose,
      /DATABASE_URL: postgresql:\/\/aep:\$\{POSTGRES_PASSWORD\}@ai-engineering-platform-db:5432\/ai-engineering-platform/,
    );
  });
});

describe(".env.example", () => {
  it("documents POSTGRES_PASSWORD with a placeholder, not a shipped default", () => {
    assert.match(envExample, /^POSTGRES_PASSWORD=change-me-local-postgres-password/m);
    assert.doesNotMatch(envExample, /aep_dev_password/);
  });
});
