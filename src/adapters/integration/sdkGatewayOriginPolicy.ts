/**
 * Exact Origin trust evaluation for SDK WebSocket upgrade (DI-11 / ADR-0018).
 * Missing, null, wildcard, suffix, and substring matches fail closed.
 */

import {
  createDefaultSdkOriginCapabilityMatrix,
  type SdkOriginTrustEntry,
  type SdkOriginTrustState,
} from "@domain/index.js";

export type SdkOriginUpgradeDecision =
  | Readonly<{ action: "reject"; reason: "origin_denied" | "origin_missing" }>
  | Readonly<{ action: "accept"; trustState: "allowed" | "unknown" }>;

/** Parse comma-separated exact Origin strings (trim; drop empties). */
export function parseSdkOriginAllowlist(
  raw: string | undefined,
): readonly string[] {
  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Load default allow seed from `AXATALK_SDK_ALLOWED_ORIGINS` (exact CSV). */
export function loadSdkOriginAllowlistFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): readonly string[] {
  return parseSdkOriginAllowlist(env["AXATALK_SDK_ALLOWED_ORIGINS"]);
}

function normalizeOriginHeader(
  originHeader: string | undefined,
): string | null {
  if (originHeader === undefined) {
    return null;
  }
  const origin = originHeader.trim();
  if (origin.length === 0) {
    return null;
  }
  if (origin.toLowerCase() === "null") {
    return null;
  }
  return origin;
}

export function resolveSdkOriginTrustState(
  origin: string,
  entries: readonly SdkOriginTrustEntry[],
): SdkOriginTrustState {
  const entry = entries.find((row) => row.origin === origin);
  return entry?.state ?? "unknown";
}

/**
 * Upgrade admission:
 * - denied → reject (no socket)
 * - allowed / unknown → accept (unknown continues to TOFU after handshake)
 */
export function evaluateSdkOriginUpgrade(
  originHeader: string | undefined,
  entries: readonly SdkOriginTrustEntry[],
): SdkOriginUpgradeDecision {
  const origin = normalizeOriginHeader(originHeader);
  if (origin === null) {
    return { action: "reject", reason: "origin_missing" };
  }
  const state = resolveSdkOriginTrustState(origin, entries);
  if (state === "denied") {
    return { action: "reject", reason: "origin_denied" };
  }
  return {
    action: "accept",
    trustState: state === "allowed" ? "allowed" : "unknown",
  };
}

/**
 * Discovery CORS: reflect exact Origin for unknown + allowed only (ADR-0018 §H).
 */
export function isSdkDiscoveryCorsEligible(
  originHeader: string | undefined,
  entries: readonly SdkOriginTrustEntry[],
): boolean {
  const origin = normalizeOriginHeader(originHeader);
  if (origin === null) {
    return false;
  }
  const state = resolveSdkOriginTrustState(origin, entries);
  return state === "unknown" || state === "allowed";
}

/**
 * Legacy helper: True only when Origin is an exact allowlist member.
 * Prefer `evaluateSdkOriginUpgrade` for DI-11 gateway paths.
 */
export function isAllowedUpgradeOrigin(
  originHeader: string | undefined,
  allowlist: readonly string[],
): boolean {
  const origin = normalizeOriginHeader(originHeader);
  if (origin === null) {
    return false;
  }
  if (allowlist.length === 0) {
    return false;
  }
  return allowlist.includes(origin);
}

/** Build allowed-only trust entries from a flat exact allowlist (tests / seed). */
export function trustEntriesFromAllowlist(
  allowlist: readonly string[],
): readonly SdkOriginTrustEntry[] {
  return allowlist.map((origin) => ({
    origin,
    state: "allowed" as const,
    matrix: createDefaultSdkOriginCapabilityMatrix(),
    previouslyAllowed: true,
  }));
}

/**
 * Merge persisted trust with env allow seed.
 * `denied` in persisted always wins over the same Origin in the seed (ADR-0018 §B).
 */
export function mergePersistedOriginTrustWithEnvSeed(
  persisted: readonly SdkOriginTrustEntry[],
  envAllowlist: readonly string[] = loadSdkOriginAllowlistFromEnv(),
): readonly SdkOriginTrustEntry[] {
  const seed = trustEntriesFromAllowlist(envAllowlist);
  const map = new Map<string, SdkOriginTrustEntry>();
  for (const entry of seed) {
    map.set(entry.origin, entry);
  }
  for (const entry of persisted) {
    const existing = map.get(entry.origin);
    if (existing === undefined) {
      map.set(entry.origin, entry);
      continue;
    }
    if (entry.state === "denied") {
      map.set(entry.origin, entry);
      continue;
    }
    if (existing.state === "denied") {
      continue;
    }
    map.set(entry.origin, entry);
  }
  return [...map.values()];
}
