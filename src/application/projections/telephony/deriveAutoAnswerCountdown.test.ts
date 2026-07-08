import { describe, expect, it } from "vitest";
import {
  computeAutoAnswerExpiresAt,
  deriveAutoAnswerSecondsRemaining,
} from "./deriveAutoAnswerCountdown.js";

describe("deriveAutoAnswerCountdown", () => {
  it("computes expiry from timeout and anchor time", () => {
    expect(computeAutoAnswerExpiresAt(5, 1_000)).toBe(new Date(6_000).toISOString());
  });

  it("returns remaining seconds until expiry inclusive of zero", () => {
    const expiresAt = new Date(10_500).toISOString();
    expect(deriveAutoAnswerSecondsRemaining(expiresAt, 5_500)).toBe(5);
    expect(deriveAutoAnswerSecondsRemaining(expiresAt, 9_600)).toBe(1);
    expect(deriveAutoAnswerSecondsRemaining(expiresAt, 10_500)).toBe(0);
    expect(deriveAutoAnswerSecondsRemaining(expiresAt, 11_000)).toBe(0);
  });

  it("returns null when expiry is missing or invalid", () => {
    expect(deriveAutoAnswerSecondsRemaining(null, Date.now())).toBeNull();
    expect(deriveAutoAnswerSecondsRemaining("invalid", Date.now())).toBeNull();
  });
});
