import { describe, expect, it } from "vitest";
import { compareSemanticVersions, isValidSemanticVersion } from "./compareSemanticVersions.js";

describe("compareSemanticVersions", () => {
  it("orders numeric segments", () => {
    expect(compareSemanticVersions("1.0.0", "1.0.1")).toBe(-1);
    expect(compareSemanticVersions("1.1.0", "1.0.9")).toBe(1);
    expect(compareSemanticVersions("2.0.0", "2.0.0")).toBe(0);
  });

  it("treats release builds as newer than prerelease", () => {
    expect(compareSemanticVersions("1.0.0", "1.0.0-beta")).toBe(1);
    expect(compareSemanticVersions("1.0.0-beta", "1.0.0")).toBe(-1);
  });

  it("returns null for invalid versions", () => {
    expect(compareSemanticVersions("v1", "1.0.0")).toBeNull();
    expect(isValidSemanticVersion("1.0")).toBe(false);
    expect(isValidSemanticVersion("1.0.0")).toBe(true);
  });
});
