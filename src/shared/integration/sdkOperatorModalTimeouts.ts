/**
 * SSoT wall-clock budgets for operator-facing SDK modals (ADR-0018).
 * Defaults match historical fixed TTLs (no downgrade). Settings may override within
 * min/max; UI countdown, gateway sweeper, and activate consent must use the live values.
 */

/** Activate / reauthorize consent modal TTL default (human decision). */
export const SDK_ACTIVATE_CONSENT_TTL_MS = 120_000;

/** Origin TOFU pending TTL default — cancel (no blacklist) when exceeded. */
export const SDK_ORIGIN_TRUST_PENDING_TTL_MS = 5 * 60_000;

/** Pairing pending TTL default — deny when exceeded (`pairing:denied`). */
export const SDK_PAIRING_PENDING_TTL_MS = 5 * 60_000;

/**
 * UI bridge after Origin Allow while waiting for `pairing:request`.
 * Local overlay only — not a Settings field / wire contract.
 */
export const SDK_CEREMONY_WAITING_PAIRING_TIMEOUT_MS = 45_000;

/** How often pending TOFU/pairing are swept for expiry in the gateway. */
export const SDK_PENDING_SWEEP_INTERVAL_MS = 15_000;

/** Inclusive Settings bounds (ms). */
export const SDK_OPERATOR_CONSENT_TTL_MIN_MS = 30_000;
export const SDK_OPERATOR_CONSENT_TTL_MAX_MS = 300_000;
export const SDK_OPERATOR_ORIGIN_TRUST_TTL_MIN_MS = 60_000;
export const SDK_OPERATOR_ORIGIN_TRUST_TTL_MAX_MS = 600_000;
export const SDK_OPERATOR_PAIRING_TTL_MIN_MS = 60_000;
export const SDK_OPERATOR_PAIRING_TTL_MAX_MS = 600_000;

export type SdkOperatorModalTimeouts = Readonly<{
  consentTtlMs: number;
  originTrustTtlMs: number;
  pairingTtlMs: number;
}>;

export const SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS: SdkOperatorModalTimeouts = {
  consentTtlMs: SDK_ACTIVATE_CONSENT_TTL_MS,
  originTrustTtlMs: SDK_ORIGIN_TRUST_PENDING_TTL_MS,
  pairingTtlMs: SDK_PAIRING_PENDING_TTL_MS,
};

/** Preset options for Settings selects (must stay within min/max). */
export const SDK_OPERATOR_CONSENT_TTL_PRESETS_MS = [
  30_000, 60_000, 120_000, 180_000, 300_000,
] as const;

export const SDK_OPERATOR_ORIGIN_TRUST_TTL_PRESETS_MS = [
  60_000, 120_000, 300_000, 600_000,
] as const;

export const SDK_OPERATOR_PAIRING_TTL_PRESETS_MS = [
  60_000, 120_000, 300_000, 600_000,
] as const;

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function normalizeSdkOperatorModalTimeouts(
  input: Partial<SdkOperatorModalTimeouts> | null | undefined,
): SdkOperatorModalTimeouts {
  const base = SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS;
  return {
    consentTtlMs: clampInt(
      input?.consentTtlMs ?? base.consentTtlMs,
      SDK_OPERATOR_CONSENT_TTL_MIN_MS,
      SDK_OPERATOR_CONSENT_TTL_MAX_MS,
    ),
    originTrustTtlMs: clampInt(
      input?.originTrustTtlMs ?? base.originTrustTtlMs,
      SDK_OPERATOR_ORIGIN_TRUST_TTL_MIN_MS,
      SDK_OPERATOR_ORIGIN_TRUST_TTL_MAX_MS,
    ),
    pairingTtlMs: clampInt(
      input?.pairingTtlMs ?? base.pairingTtlMs,
      SDK_OPERATOR_PAIRING_TTL_MIN_MS,
      SDK_OPERATOR_PAIRING_TTL_MAX_MS,
    ),
  };
}

/** Parse allowlisted timeouts from unknown settings / IPC (fail → defaults). */
export function parseSdkOperatorModalTimeouts(
  value: unknown,
): SdkOperatorModalTimeouts {
  if (typeof value !== "object" || value === null) {
    return { ...SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS };
  }
  const record = value as Record<string, unknown>;
  const partial: {
    consentTtlMs?: number;
    originTrustTtlMs?: number;
    pairingTtlMs?: number;
  } = {};
  if (typeof record["consentTtlMs"] === "number") {
    partial.consentTtlMs = record["consentTtlMs"];
  }
  if (typeof record["originTrustTtlMs"] === "number") {
    partial.originTrustTtlMs = record["originTrustTtlMs"];
  }
  if (typeof record["pairingTtlMs"] === "number") {
    partial.pairingTtlMs = record["pairingTtlMs"];
  }
  return normalizeSdkOperatorModalTimeouts(partial);
}

/** Compute ISO expiresAt from createdAt + TTL (fail-closed to createdAt on bad input). */
export function computeSdkPendingExpiresAtIso(
  createdAtIso: string,
  ttlMs: number,
): string {
  const createdMs = Date.parse(createdAtIso);
  if (!Number.isFinite(createdMs) || ttlMs <= 0) {
    return createdAtIso;
  }
  return new Date(createdMs + ttlMs).toISOString();
}
