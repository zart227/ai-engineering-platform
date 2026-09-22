import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyBookmarkHref,
  sanitizeBookmarkHrefForImport,
} from "../src/server/bookmark-href";

describe("classifyBookmarkHref", () => {
  it("keeps internal paths", () => {
    assert.deepEqual(classifyBookmarkHref("/week/foundations"), {
      kind: "internal",
      href: "/week/foundations",
    });
    assert.deepEqual(classifyBookmarkHref("/glossary#term"), {
      kind: "internal",
      href: "/glossary#term",
    });
  });

  it("keeps external https links", () => {
    assert.deepEqual(classifyBookmarkHref("https://example.com/docs"), {
      kind: "external",
      href: "https://example.com/docs",
    });
  });

  it("rejects javascript: URLs", () => {
    assert.deepEqual(classifyBookmarkHref("javascript:alert(1)"), { kind: "unsafe" });
    assert.deepEqual(classifyBookmarkHref("JavaScript:alert(1)"), { kind: "unsafe" });
    assert.equal(sanitizeBookmarkHrefForImport("javascript:alert(1)"), null);
  });

  it("rejects protocol-relative URLs", () => {
    assert.deepEqual(classifyBookmarkHref("//evil"), { kind: "unsafe" });
    assert.deepEqual(classifyBookmarkHref("//evil.example/phish"), { kind: "unsafe" });
    assert.equal(sanitizeBookmarkHrefForImport("//evil"), null);
  });

  it("rejects other active schemes and traversal tricks", () => {
    assert.deepEqual(classifyBookmarkHref("data:text/html,<script>"), { kind: "unsafe" });
    assert.deepEqual(classifyBookmarkHref("/\\evil.example"), { kind: "unsafe" });
    assert.deepEqual(classifyBookmarkHref("vbscript:msgbox(1)"), { kind: "unsafe" });
  });
});
