import { describe, expect, it } from "vitest";
import {
  deriveStatusDurationSeconds,
  deriveStatusTimerRunning,
} from "./operatorStatusTimerProjection.js";

describe("operatorStatusTimerProjection", () => {
  it("derives duration seconds from statusChangedAt", () => {
    const changedAt = "2026-06-23T10:00:00.000Z";
    const nowIso = "2026-06-23T10:01:30.000Z";

    expect(deriveStatusDurationSeconds(changedAt, nowIso)).toBe(90);
  });

  it("returns null when statusChangedAt is missing", () => {
    expect(deriveStatusDurationSeconds(null, new Date().toISOString())).toBeNull();
  });

  it("reports timer running when status and timestamp exist", () => {
    expect(
      deriveStatusTimerRunning("ready", "2026-06-23T10:00:00.000Z"),
    ).toBe(true);
    expect(deriveStatusTimerRunning(null, "2026-06-23T10:00:00.000Z")).toBe(false);
  });
});
