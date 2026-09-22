import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const gatedPages = [
  "src/app/search/page.tsx",
  "src/app/map/page.tsx",
  "src/app/glossary/page.tsx",
];

describe("course read session gate", () => {
  it("gates search, map, and glossary on getSession before course text", () => {
    for (const file of gatedPages) {
      const source = readFileSync(file, "utf8");
      assert.match(source, /getSession\(/, `${file} must call getSession()`);
      assert.equal(source.includes("cookies("), false, `${file} must not read cookies directly`);
      assert.equal(source.includes("aep_session"), false, `${file} must not trust cookie presence`);
      assert.match(source, /session\s*(\?|&&)/, `${file} must hide course text without a session`);
    }
  });

  it("keeps API search on getSession and does not trust cookie strings", () => {
    const route = readFileSync("src/app/api/search/route.ts", "utf8");
    assert.match(route, /getSession\(/);
    assert.equal(route.includes("cookies("), false);
    assert.equal(route.includes("aep_session"), false);
    assert.match(route, /if \(!session\)/);
  });

  it("checks session before course MCP tools in callTool", () => {
    const source = readFileSync("src/server/mcp.ts", "utf8");
    const callTool = source.slice(source.indexOf("async function callTool"));
    const searchIndex = callTool.indexOf('name === "course.search"');
    const sessionIndex = callTool.indexOf("if (!sessionUserId)");
    assert.ok(sessionIndex >= 0, "callTool must gate on sessionUserId");
    assert.ok(searchIndex > sessionIndex, "course.search must run after the session gate");
    assert.match(callTool.slice(sessionIndex, searchIndex), /sessionUserId/);
  });
});
