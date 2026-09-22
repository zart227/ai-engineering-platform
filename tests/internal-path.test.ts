import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeInternalPath } from "../src/server/internal-path";

describe("safeInternalPath", () => {
  it("keeps an internal path and query", () => {
    assert.equal(safeInternalPath("/week/how-llms-work"), "/week/how-llms-work");
    assert.equal(safeInternalPath("/search?q=ollama"), "/search?q=ollama");
  });

  it("rejects external and protocol-relative targets", () => {
    assert.equal(safeInternalPath("https://evil.example/week"), "/");
    assert.equal(safeInternalPath("//evil.example/week"), "/");
    assert.equal(safeInternalPath("/\\evil.example"), "/");
    assert.equal(safeInternalPath("week/how-llms-work"), "/");
    assert.equal(safeInternalPath(""), "/");
    assert.equal(safeInternalPath(null), "/");
  });
});
