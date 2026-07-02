import { describe, expect, it } from "vitest";
import {
  applySipSessionReset,
  applySipTransportLoss,
  createIdleSipSessionHealth,
  getEffectiveRegistrationState,
  isEffectivelyRegistered,
  validateSipSessionHealthInvariants,
} from "./SipSessionHealth.js";

describe("SipSessionHealth", () => {
  it("creates idle health", () => {
    const health = createIdleSipSessionHealth();
    expect(health.lifecycle).toBe("idle");
    expect(health.transport).toBe("idle");
    expect(health.registration).toBe("idle");
    expect(health.recovery.target).toBeNull();
  });

  it("effective registration is idle when transport is down", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "disconnected" as const,
      registration: "registered" as const,
    };

    expect(getEffectiveRegistrationState(health)).toBe("idle");
    expect(isEffectivelyRegistered(health)).toBe(false);
    expect(validateSipSessionHealthInvariants(health)).toHaveLength(1);
  });

  it("effective registration follows stored state when transport connected", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "connected" as const,
      registration: "registered" as const,
    };

    expect(getEffectiveRegistrationState(health)).toBe("registered");
    expect(isEffectivelyRegistered(health)).toBe(true);
    expect(validateSipSessionHealthInvariants(health)).toHaveLength(0);
  });

  it("rejects registration recovery while transport down", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "disconnected" as const,
      registration: "failed" as const,
      recovery: {
        target: "registration" as const,
        attemptNumber: 1,
        maxAttempts: 5,
        nextRetryAt: null,
        lastFailureReason: "forbidden",
      },
    };

    const violations = validateSipSessionHealthInvariants(health);
    expect(violations.some((v) => v.code === "registration_recovery_while_transport_down")).toBe(
      true,
    );
  });

  it("applySipTransportLoss clears registration", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "connected" as const,
      registration: "registered" as const,
    };

    const next = applySipTransportLoss(health);
    expect(next.transport).toBe("disconnected");
    expect(next.registration).toBe("idle");
  });

  it("applySipSessionReset returns fully idle health", () => {
    const health = {
      ...createIdleSipSessionHealth(),
      lifecycle: "active" as const,
      transport: "reconnecting" as const,
      registration: "registering" as const,
      recovery: {
        target: "transport" as const,
        attemptNumber: 2,
        maxAttempts: 5,
        nextRetryAt: "2026-07-02T10:00:00.000Z",
        lastFailureReason: "connection_error",
      },
    };

    expect(applySipSessionReset(health)).toEqual(createIdleSipSessionHealth());
  });
});
