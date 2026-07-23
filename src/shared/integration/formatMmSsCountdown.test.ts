import { describe, expect, it } from "vitest";
import {
  deriveSecondsRemainingUntil,
  formatMmSsCountdown,
} from "./formatMmSsCountdown.js";

describe("formatMmSsCountdown", () => {
  it("pads minutes and seconds", () => {
    expect(formatMmSsCountdown(90)).toBe("01:30");
    expect(formatMmSsCountdown(30)).toBe("00:30");
    expect(formatMmSsCountdown(120)).toBe("02:00");
    expect(formatMmSsCountdown(0)).toBe("00:00");
    expect(formatMmSsCountdown(5 * 60)).toBe("05:00");
  });

  it("clamps negative input", () => {
    expect(formatMmSsCountdown(-3)).toBe("00:00");
  });
});

describe("deriveSecondsRemainingUntil", () => {
  it("ceils partial seconds and clamps past deadlines", () => {
    const expiresAt = "2026-07-23T12:00:30.000Z";
    const now = Date.parse("2026-07-23T12:00:00.400Z");
    expect(deriveSecondsRemainingUntil(expiresAt, now)).toBe(30);
    expect(
      deriveSecondsRemainingUntil(expiresAt, Date.parse("2026-07-23T12:00:31.000Z")),
    ).toBe(0);
  });
});
