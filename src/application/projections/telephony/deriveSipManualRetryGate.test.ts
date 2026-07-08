import { describe, expect, it } from "vitest";
import { createIdleSipSessionHealth, EMPTY_SIP_RECOVERY_SNAPSHOT } from "@domain/index.js";
import {
  isSipManualRetryAvailable,
  isSipRecoveryInProgress,
} from "./deriveSipManualRetryGate.js";

describe("deriveSipManualRetryGate", () => {
  it("detects recovery in progress from scheduled retry", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "reconnecting" as const,
      recovery: {
        target: "transport" as const,
        attemptNumber: 1,
        maxAttempts: 5,
        nextRetryAt: "2026-07-04T12:00:05.000Z",
        lastFailureReason: null,
      },
    };

    expect(isSipRecoveryInProgress(health)).toBe(true);
    expect(isSipManualRetryAvailable(health)).toBe(false);
  });

  it("allows manual retry after terminal transport failure", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "disconnected" as const,
      registration: "idle" as const,
      recovery: {
        target: "transport" as const,
        attemptNumber: 5,
        maxAttempts: 5,
        nextRetryAt: null,
        lastFailureReason: "transport_closed",
      },
    };

    expect(isSipRecoveryInProgress(health)).toBe(false);
    expect(isSipManualRetryAvailable(health)).toBe(true);
  });

  it("rejects manual retry when lifecycle is idle", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      recovery: EMPTY_SIP_RECOVERY_SNAPSHOT,
    };

    expect(isSipManualRetryAvailable(health)).toBe(false);
  });
});
