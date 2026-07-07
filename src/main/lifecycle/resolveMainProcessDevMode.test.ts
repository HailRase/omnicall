import { describe, expect, it } from "vitest";
import { resolveMainProcessDevMode } from "./resolveMainProcessDevMode.js";

describe("resolveMainProcessDevMode", () => {
  it("returns true when the app is not packaged", () => {
    expect(resolveMainProcessDevMode(false)).toBe(true);
  });

  it("returns false when the app is packaged", () => {
    expect(resolveMainProcessDevMode(true)).toBe(false);
  });
});
