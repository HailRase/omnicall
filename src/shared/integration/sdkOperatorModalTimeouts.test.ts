import { describe, expect, it } from "vitest";
import { SDK_ACTIVATE_CONSENT_TTL_MS } from "./sdkActivateTimeouts.js";
import {
  computeSdkPendingExpiresAtIso,
  normalizeSdkOperatorModalTimeouts,
  parseSdkOperatorModalTimeouts,
  SDK_ACTIVATE_CONSENT_TTL_MS as FROM_OPERATOR,
  SDK_CEREMONY_WAITING_PAIRING_TIMEOUT_MS,
  SDK_OPERATOR_CONSENT_TTL_MAX_MS,
  SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS,
  SDK_ORIGIN_TRUST_PENDING_TTL_MS,
  SDK_PAIRING_PENDING_TTL_MS,
  SDK_PENDING_SWEEP_INTERVAL_MS,
} from "./sdkOperatorModalTimeouts.js";

describe("sdkOperatorModalTimeouts", () => {
  it("keeps documented operator budgets stable", () => {
    expect(FROM_OPERATOR).toBe(120_000);
    expect(FROM_OPERATOR).toBe(SDK_ACTIVATE_CONSENT_TTL_MS);
    expect(SDK_ORIGIN_TRUST_PENDING_TTL_MS).toBe(5 * 60_000);
    expect(SDK_PAIRING_PENDING_TTL_MS).toBe(5 * 60_000);
    expect(SDK_CEREMONY_WAITING_PAIRING_TIMEOUT_MS).toBe(45_000);
    expect(SDK_PENDING_SWEEP_INTERVAL_MS).toBe(15_000);
    expect(SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS).toEqual({
      consentTtlMs: 120_000,
      originTrustTtlMs: 5 * 60_000,
      pairingTtlMs: 5 * 60_000,
    });
  });

  it("clamps and parses timeouts without downgrading defaults on empty input", () => {
    expect(parseSdkOperatorModalTimeouts(undefined)).toEqual(
      SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS,
    );
    expect(
      normalizeSdkOperatorModalTimeouts({
        consentTtlMs: 10,
        originTrustTtlMs: 999_999,
        pairingTtlMs: 120_000,
      }),
    ).toEqual({
      consentTtlMs: 30_000,
      originTrustTtlMs: 600_000,
      pairingTtlMs: 120_000,
    });
    expect(SDK_OPERATOR_CONSENT_TTL_MAX_MS).toBe(300_000);
  });

  it("computes expiresAt from createdAt + TTL", () => {
    expect(
      computeSdkPendingExpiresAtIso("2026-07-23T12:00:00.000Z", 120_000),
    ).toBe("2026-07-23T12:02:00.000Z");
  });
});
