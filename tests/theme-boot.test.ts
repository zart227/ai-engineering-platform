import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { forcedThemeFor, systemThemeBootScript } from "../src/components/theme-boot";

describe("saved system theme", () => {
  it("does not force the class name system", () => {
    assert.equal(forcedThemeFor("system"), undefined);
    assert.equal(forcedThemeFor("light"), "light");
    assert.equal(forcedThemeFor("dark"), "dark");
    assert.equal(forcedThemeFor("other"), undefined);
  });

  it("resolves system to the OS scheme before paint and stores system for later changes", () => {
    const script = systemThemeBootScript();
    assert.match(script, /prefers-color-scheme: dark/);
    assert.match(script, /classList\.toggle\("dark",d\)/);
    assert.match(script, /localStorage\.setItem\("theme","system"\)/);
  });
});