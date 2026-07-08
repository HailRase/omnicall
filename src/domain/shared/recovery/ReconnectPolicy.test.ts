import { describe, expect, it } from "vitest";
import {
  SIP_RECONNECT_POLICY_CONFIG,
  canScheduleReconnectAttempt,
  computeBaseBackoffDelayMs,
  computeReconnectDelayBounds,
  computeReconnectDelayMs,
  isTerminalReconnectFailure,
  planReconnectAttempt,
} from "./ReconnectPolicy.js";

describe("ReconnectPolicy", () => {
  const fixedRandom = (value: number) => (): number => value;

  describe("SIP preset (LF-008)", () => {
    it("uses flat 5s base delay for each attempt", () => {
      expect(computeBaseBackoffDelayMs(1, SIP_RECONNECT_POLICY_CONFIG)).toBe(5000);
      expect(computeBaseBackoffDelayMs(5, SIP_RECONNECT_POLICY_CONFIG)).toBe(5000);
    });

    it("schedules attempts 1 through maxAttempts", () => {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        expect(canScheduleReconnectAttempt(attempt, SIP_RECONNECT_POLICY_CONFIG)).toBe(true);
      }
      expect(canScheduleReconnectAttempt(6, SIP_RECONNECT_POLICY_CONFIG)).toBe(false);
    });

    it("marks terminal failure after max attempts", () => {
      expect(isTerminalReconnectFailure(4, SIP_RECONNECT_POLICY_CONFIG)).toBe(false);
      expect(isTerminalReconnectFailure(5, SIP_RECONNECT_POLICY_CONFIG)).toBe(true);
    });
  });

  describe("jitter", () => {
    it("returns base delay at random midpoint", () => {
      const delay = computeReconnectDelayMs(1, SIP_RECONNECT_POLICY_CONFIG, fixedRandom(0.5));
      expect(delay).toBe(5000);
    });

    it("respects jitter lower bound", () => {
      const delay = computeReconnectDelayMs(1, SIP_RECONNECT_POLICY_CONFIG, fixedRandom(0));
      const { minDelayMs } = computeReconnectDelayBounds(1, SIP_RECONNECT_POLICY_CONFIG);
      expect(delay).toBe(minDelayMs);
    });

    it("respects jitter upper bound", () => {
      const delay = computeReconnectDelayMs(1, SIP_RECONNECT_POLICY_CONFIG, fixedRandom(1));
      const { maxDelayMs } = computeReconnectDelayBounds(1, SIP_RECONNECT_POLICY_CONFIG);
      expect(delay).toBe(maxDelayMs);
    });
  });

  describe("planReconnectAttempt", () => {
    it("returns null when attempt exceeds max", () => {
      expect(planReconnectAttempt(6, SIP_RECONNECT_POLICY_CONFIG, fixedRandom(0.5))).toBeNull();
    });

    it("returns attempt number and delay for valid attempt", () => {
      const plan = planReconnectAttempt(3, SIP_RECONNECT_POLICY_CONFIG, fixedRandom(0.5));
      expect(plan).toEqual({ attemptNumber: 3, delayMs: 5000 });
    });
  });
});
