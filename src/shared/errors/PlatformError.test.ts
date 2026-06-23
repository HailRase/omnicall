import { describe, expect, it } from "vitest";
import {
  createPlatformError,
  isPlatformError,
  normalizeUnknownError,
} from "./PlatformError.js";

describe("PlatformError", () => {
  it("creates a typed error without cause", () => {
    const error = createPlatformError("validation_failed", "Invalid input");
    expect(error).toEqual({
      code: "validation_failed",
      message: "Invalid input",
    });
  });

  it("normalizes native Error instances", () => {
    const native = new Error("boom");
    const normalized = normalizeUnknownError(native);
    expect(normalized.code).toBe("unknown");
    expect(normalized.message).toBe("boom");
    expect(normalized.cause).toBe(native);
  });

  it("detects platform errors", () => {
    const error = createPlatformError("timeout", "Timed out");
    expect(isPlatformError(error)).toBe(true);
    expect(isPlatformError({ code: 1, message: "x" })).toBe(false);
  });
});
