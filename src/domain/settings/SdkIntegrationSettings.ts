/**
 * - Purpose: persisted local SDK gateway Origin trust + matrix (DI-11 / ADR-0018).
 * - Inputs: unknown boundary payloads from settings JSON.
 * - Outputs: typed SdkIntegrationSettings or null when invalid.
 * - Note: listener enable toggle removed; env AXATALK_SDK_GATEWAY=0 is kill-switch only.
 */

import {
  createDefaultSdkOriginCapabilityMatrix,
  SDK_ORIGIN_MATRIX_CAPABILITY_IDS,
  type SdkOriginCapabilityMatrix,
  type SdkOriginMatrixCapabilityId,
  type SdkOriginTrustEntry,
  type SdkOriginTrustState,
} from "./SdkOriginTrust.js";

/** Max exact Origin entries in the trust store. */
export const MAX_SDK_ALLOWED_ORIGINS = 64;

/** Max length of a single exact Origin string. */
export const MAX_SDK_ORIGIN_LENGTH = 253;

export type SdkIntegrationSettings = Readonly<{
  /**
   * Persisted Origin trust rows (allowed / denied / unknown).
   * When `originsManaged` is false, live gateway may still seed from env allowlist.
   */
  origins: readonly SdkOriginTrustEntry[];
  /**
   * True after the operator explicitly edits Origin policy in Settings.
   * False keeps boot-time env allow seed until first managed save.
   */
  originsManaged: boolean;
}>;

export const SDK_INTEGRATION_DEFAULTS: SdkIntegrationSettings = {
  origins: [],
  originsManaged: false,
};

function isValidOriginString(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_SDK_ORIGIN_LENGTH) {
    return false;
  }
  if (trimmed.toLowerCase() === "null") {
    return false;
  }
  if (trimmed.includes("*")) {
    return false;
  }
  return true;
}

function parseTrustState(value: unknown): SdkOriginTrustState | null {
  if (value === "unknown" || value === "allowed" || value === "denied") {
    return value;
  }
  return null;
}

type ParseMatrixResult =
  | Readonly<{ ok: true; matrix: SdkOriginCapabilityMatrix | null }>
  | Readonly<{ ok: false }>;

function parseMatrix(value: unknown): ParseMatrixResult {
  if (value === null || value === undefined) {
    return { ok: true, matrix: null };
  }
  if (typeof value !== "object") {
    return { ok: false };
  }
  const record = value as Record<string, unknown>;
  const capabilitiesRaw = record["capabilities"];
  if (typeof capabilitiesRaw !== "object" || capabilitiesRaw === null) {
    return { ok: false };
  }
  const caps = capabilitiesRaw as Record<string, unknown>;
  const capabilities = {} as Record<SdkOriginMatrixCapabilityId, boolean>;
  for (const id of SDK_ORIGIN_MATRIX_CAPABILITY_IDS) {
    const flag = caps[id];
    if (typeof flag !== "boolean") {
      return { ok: false };
    }
    capabilities[id] = flag;
  }
  return { ok: true, matrix: { capabilities } };
}

function parseTrustEntry(value: unknown): SdkOriginTrustEntry | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record["origin"] !== "string") {
    return null;
  }
  const origin = record["origin"].trim();
  if (!isValidOriginString(origin)) {
    return null;
  }
  const state = parseTrustState(record["state"]);
  if (state === null) {
    return null;
  }
  if (typeof record["previouslyAllowed"] !== "boolean") {
    return null;
  }
  const matrixResult = parseMatrix(record["matrix"]);
  if (!matrixResult.ok) {
    return null;
  }
  if (state === "allowed" && matrixResult.matrix === null) {
    return null;
  }
  return {
    origin,
    state,
    matrix: matrixResult.matrix,
    previouslyAllowed: record["previouslyAllowed"],
  };
}

/**
 * Migrate DI-09 flat allowlist blob into trust entries (v10 → v11).
 */
export function migrateLegacySdkIntegrationSettings(
  value: unknown,
): SdkIntegrationSettings | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record["allowedOrigins"])) {
    return null;
  }
  const originsManaged =
    typeof record["originsManaged"] === "boolean"
      ? record["originsManaged"]
      : false;
  const origins: SdkOriginTrustEntry[] = [];
  for (const entry of record["allowedOrigins"]) {
    if (typeof entry !== "string" || !isValidOriginString(entry)) {
      return null;
    }
    const origin = entry.trim();
    if (origins.some((row) => row.origin === origin)) {
      continue;
    }
    origins.push({
      origin,
      state: "allowed",
      matrix: createDefaultSdkOriginCapabilityMatrix(),
      previouslyAllowed: true,
    });
  }
  if (origins.length > MAX_SDK_ALLOWED_ORIGINS) {
    return null;
  }
  return { origins, originsManaged };
}

/**
 * - Purpose: narrow unknown sdkIntegration blob to typed settings.
 * - Inputs: unknown field value from persisted JSON.
 * - Outputs: SdkIntegrationSettings or null when shape/types are invalid.
 */
export function parseSdkIntegrationSettings(
  value: unknown,
): SdkIntegrationSettings | null {
  if (value === undefined || value === null) {
    return { ...SDK_INTEGRATION_DEFAULTS };
  }
  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  // DI-09 → DI-11: flat allowlist + enabled flag.
  if (Array.isArray(record["allowedOrigins"]) && !Array.isArray(record["origins"])) {
    return migrateLegacySdkIntegrationSettings(value);
  }

  const originsManagedRaw = record["originsManaged"];
  const originsManaged =
    typeof originsManagedRaw === "boolean" ? originsManagedRaw : false;

  const originsRaw = record["origins"];
  if (!Array.isArray(originsRaw)) {
    return null;
  }
  if (originsRaw.length > MAX_SDK_ALLOWED_ORIGINS) {
    return null;
  }

  const origins: SdkOriginTrustEntry[] = [];
  for (const entry of originsRaw) {
    const parsed = parseTrustEntry(entry);
    if (parsed === null) {
      return null;
    }
    if (origins.some((row) => row.origin === parsed.origin)) {
      continue;
    }
    origins.push(parsed);
  }

  return {
    origins,
    originsManaged,
  };
}

/**
 * - Purpose: normalize operator-edited origins text into exact Origin strings.
 * - Inputs: newline- or comma-separated draft; fails closed on wildcards/null.
 * - Outputs: parsed list or null when any entry is invalid.
 */
export function parseSdkOriginsDraft(raw: string): readonly string[] | null {
  const parts = raw
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length > MAX_SDK_ALLOWED_ORIGINS) {
    return null;
  }
  const origins: string[] = [];
  for (const part of parts) {
    if (!isValidOriginString(part)) {
      return null;
    }
    if (!origins.includes(part)) {
      origins.push(part);
    }
  }
  return origins;
}

/** Allowed Origins only (authorization / Settings CRUD). */
export function listAllowedSdkOrigins(
  settings: SdkIntegrationSettings,
): readonly string[] {
  return settings.origins
    .filter((entry) => entry.state === "allowed")
    .map((entry) => entry.origin);
}

/** Blacklisted Origins. */
export function listDeniedSdkOrigins(
  settings: SdkIntegrationSettings,
): readonly string[] {
  return settings.origins
    .filter((entry) => entry.state === "denied")
    .map((entry) => entry.origin);
}

export function findSdkOriginTrustEntry(
  settings: SdkIntegrationSettings,
  origin: string,
): SdkOriginTrustEntry | null {
  return settings.origins.find((entry) => entry.origin === origin) ?? null;
}
