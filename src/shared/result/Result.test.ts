import { describe, expect, it } from "vitest";
import { createPlatformError } from "../errors/PlatformError.js";
import {
  err,
  isErr,
  isOk,
  mapError,
  mapResult,
  ok,
  unwrapOr,
} from "./Result.js";

describe("Result", () => {
  it("represents success", () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(result.value).toBe(42);
  });

  it("represents failure", () => {
    const result = err(createPlatformError("operation_failed", "failed"));
    expect(isErr(result)).toBe(true);
    expect(result.error.message).toBe("failed");
  });

  it("maps success values", () => {
    const result = mapResult(ok(2), (value) => value * 2);
    expect(result).toEqual(ok(4));
  });

  it("maps errors", () => {
    const result = mapError(
      err(createPlatformError("timeout", "slow")),
      (error) => createPlatformError("operation_failed", error.message),
    );
    expect(result).toEqual(
      err(createPlatformError("operation_failed", "slow")),
    );
  });

  it("unwraps with fallback", () => {
    const success = unwrapOr(ok("value"), "fallback");
    const failure = unwrapOr(
      err(createPlatformError("unknown", "x")),
      "fallback",
    );
    expect(success).toBe("value");
    expect(failure).toBe("fallback");
  });
});
