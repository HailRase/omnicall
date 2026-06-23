import { describe, expect, it } from "vitest";
import {
  createMainAcallId,
  isMainAcallIdEqual,
  parseMainAcallId,
  validateMainAcallId,
} from "./MainAcallId.js";

describe("MainAcallId", () => {
  it("validates non-empty main_acallid", () => {
    expect(validateMainAcallId("acall-100")).toEqual([]);
    expect(validateMainAcallId("")).toEqual(["main_acallid_required"]);
    expect(validateMainAcallId("   ")).toEqual(["main_acallid_required"]);
  });

  it("creates branded id from valid string", () => {
    const id = createMainAcallId("  acall-100  ");
    expect(id).toBe("acall-100");
  });

  it("throws when creating invalid id", () => {
    expect(() => createMainAcallId("")).toThrow(/Invalid MainAcallId/);
  });

  it("parses unknown boundary values", () => {
    expect(parseMainAcallId("acall-1")).toBe("acall-1");
    expect(parseMainAcallId(null)).toBeNull();
    expect(parseMainAcallId(42)).toBeNull();
    expect(parseMainAcallId("")).toBeNull();
  });

  it("uses exact equality without partial match", () => {
    const full = createMainAcallId("acall-100");
    const partial = createMainAcallId("acall-10");
    expect(isMainAcallIdEqual(full, full)).toBe(true);
    expect(isMainAcallIdEqual(full, partial)).toBe(false);
    expect(full.includes(partial)).toBe(true);
  });
});
