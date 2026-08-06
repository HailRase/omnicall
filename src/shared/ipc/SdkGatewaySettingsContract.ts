/**
 * Typed IPC contract for SDK gateway Settings / operational UX (DI-09).
 * Payloads are allowlisted — no secrets, public keys, or reusable bearers.
 */

import { parseSdkGatewaySettingsSnapshot } from "./parseSdkGatewaySettingsSnapshot.js";
import type {
  SdkOriginCapabilityMatrix,
  SdkOriginTrustEntry,
} from "@domain/settings/SdkOriginTrust.js";
import { parseSdkOperatorModalTimeouts } from "@shared/integration/sdkOperatorModalTimeouts.js";

export type SdkGatewayOperationalStatus = "disabled" | "listening";

export type SdkPairedClientProjection = Readonly<{
  clientId: string;
  origin: string;
  profile: string;
  applicationName: string;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
  capabilityCount: number;
}>;

export type SdkPendingPairingProjection = Readonly<{
  pairingRequestId: string;
  clientId: string;
  origin: string;
  applicationName: string;
  profile: string;
  expiresAt: string;
}>;

export type SdkGatewayDiagnosticsProjection = Readonly<{
  status: SdkGatewayOperationalStatus;
  bindHost: string | null;
  bindPort: number | null;
  connectionCount: number;
  authenticatedCount: number;
  unauthenticatedCount: number;
  pendingPairingCount: number;
  pairedClientCount: number;
  allowedOriginsCount: number;
  lastErrorCode: string | null;
  /** ADR-0013: product surface supports window:hide (matrix-gated). */
  windowHideAvailable: boolean;
}>;

export type SdkOperatorModalTimeoutsPolicy = Readonly<{
  consentTtlMs: number;
  originTrustTtlMs: number;
  pairingTtlMs: number;
}>;

export type SdkGatewaySettingsPolicyPayload = Readonly<{
  originsManaged: boolean;
  origins: readonly SdkOriginTrustEntry[];
  /** Optional — omit → gateway keeps previous / defaults. */
  operatorModalTimeouts?: SdkOperatorModalTimeoutsPolicy;
}>;

export type SdkGatewaySettingsOperation =
  | Readonly<{ op: "getSnapshot" }>
  | Readonly<{ op: "applyPolicy"; policy: SdkGatewaySettingsPolicyPayload }>
  | Readonly<{ op: "approvePairing"; pairingRequestId: string }>
  | Readonly<{ op: "denyPairing"; pairingRequestId: string }>
  | Readonly<{ op: "revokeClient"; clientId: string; origin: string }>
  | Readonly<{
      op: "allowOriginTrust" | "denyOriginTrust" | "cancelOriginTrust";
      origin?: string;
      originTrustRequestId?: string;
    }>
  | Readonly<{ op: "unblockOrigin"; origin: string }>
  | Readonly<{
      op: "setOriginMatrix";
      origin: string;
      matrix: SdkOriginCapabilityMatrix;
    }>;

export type SdkGatewaySettingsSnapshot = Readonly<{
  diagnostics: SdkGatewayDiagnosticsProjection;
  origins?: readonly SdkOriginTrustEntry[];
  pendingOriginTrust?: readonly SdkPendingOriginTrustProjection[];
  paired?: readonly SdkPairedClientProjection[];
  pairedClients?: readonly SdkPairedClientProjection[];
  allowedOrigins?: readonly string[];
  pendingPairing: readonly SdkPendingPairingProjection[];
}>;

export type SdkPendingOriginTrustProjection = Readonly<{
  originTrustRequestId: string;
  origin: string;
  createdAt: string;
  /** Wall deadline for operator TOFU (createdAt + SDK_ORIGIN_TRUST_PENDING_TTL_MS). */
  expiresAt: string;
}>;

export type SdkGatewaySettingsResponse =
  | Readonly<{
      ok: true;
      snapshot: SdkGatewaySettingsSnapshot;
    }>
  | Readonly<{ ok: false; reason: string }>;

const MAX_ID_LENGTH = 128;
const MAX_ORIGINS = 64;
const MAX_ORIGIN_LENGTH = 253;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePolicy(value: unknown): SdkGatewaySettingsPolicyPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record["originsManaged"] !== "boolean") {
    return null;
  }
  const originsRaw = record["origins"];
  if (!Array.isArray(originsRaw) || originsRaw.length > MAX_ORIGINS) {
    return null;
  }
  const origins: SdkOriginTrustEntry[] = [];
  for (const entry of originsRaw) {
    if (typeof entry !== "object" || entry === null) {
      return null;
    }
    const row = entry as Record<string, unknown>;
    if (
      typeof row["origin"] !== "string" ||
      typeof row["state"] !== "string" ||
      typeof row["previouslyAllowed"] !== "boolean"
    ) {
      return null;
    }
    const origin = row["origin"].trim();
    if (
      origin.length === 0 ||
      origin.length > MAX_ORIGIN_LENGTH ||
      origin.toLowerCase() === "null" ||
      origin.includes("*") ||
      (row["state"] !== "unknown" &&
        row["state"] !== "allowed" &&
        row["state"] !== "denied")
    ) {
      return null;
    }
    origins.push({
      origin,
      state: row["state"],
      previouslyAllowed: row["previouslyAllowed"],
      matrix: row["matrix"] as SdkOriginTrustEntry["matrix"],
    });
  }
  const timeoutsRaw = record["operatorModalTimeouts"];
  return {
    originsManaged: record["originsManaged"],
    origins,
    ...(timeoutsRaw !== undefined
      ? { operatorModalTimeouts: parseSdkOperatorModalTimeouts(timeoutsRaw) }
      : {}),
  };
}

/**
 * - Purpose: validate sdk-gateway settings IPC request at preload boundary.
 */
export function parseSdkGatewaySettingsOperation(
  value: unknown,
): SdkGatewaySettingsOperation | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const op = record["op"];
  if (typeof op !== "string") {
    return null;
  }
  switch (op) {
    case "getSnapshot":
      return { op };
    case "applyPolicy": {
      const policy = parsePolicy(record["policy"]);
      if (policy === null) {
        return null;
      }
      return { op, policy };
    }
    case "approvePairing":
    case "denyPairing": {
      const pairingRequestId = record["pairingRequestId"];
      if (!isNonEmptyString(pairingRequestId) || pairingRequestId.length > MAX_ID_LENGTH) {
        return null;
      }
      return { op, pairingRequestId: pairingRequestId.trim() };
    }
    case "revokeClient": {
      const clientId = record["clientId"];
      const origin = record["origin"];
      if (
        !isNonEmptyString(clientId) ||
        clientId.length > MAX_ID_LENGTH ||
        !isNonEmptyString(origin) ||
        origin.length > MAX_ORIGIN_LENGTH ||
        origin.toLowerCase() === "null" ||
        origin.includes("*")
      ) {
        return null;
      }
      return { op, clientId: clientId.trim(), origin: origin.trim() };
    }
    case "allowOriginTrust":
    case "denyOriginTrust":
    case "cancelOriginTrust": {
      const origin = record["origin"];
      const originTrustRequestId = record["originTrustRequestId"];
      if (
        (origin === undefined || !isNonEmptyString(origin) || origin.length > MAX_ORIGIN_LENGTH) &&
        (originTrustRequestId === undefined ||
          !isNonEmptyString(originTrustRequestId) ||
          originTrustRequestId.length > MAX_ID_LENGTH)
      ) {
        return null;
      }
      return {
        op,
        ...(isNonEmptyString(origin) ? { origin: origin.trim() } : {}),
        ...(isNonEmptyString(originTrustRequestId)
          ? { originTrustRequestId: originTrustRequestId.trim() }
          : {}),
      };
    }
    case "unblockOrigin": {
      const origin = record["origin"];
      if (!isNonEmptyString(origin) || origin.length > MAX_ORIGIN_LENGTH) {
        return null;
      }
      return { op, origin: origin.trim() };
    }
    case "setOriginMatrix": {
      const origin = record["origin"];
      const matrix = record["matrix"];
      if (!isNonEmptyString(origin) || typeof matrix !== "object" || matrix === null) {
        return null;
      }
      return { op, origin: origin.trim(), matrix: matrix as SdkOriginCapabilityMatrix };
    }
    default:
      return null;
  }
}

/**
 * - Purpose: validate sdk-gateway settings IPC response at preload boundary.
 */
export function parseSdkGatewaySettingsResponse(
  value: unknown,
): SdkGatewaySettingsResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record["ok"] === false) {
    return typeof record["reason"] === "string"
      ? { ok: false, reason: record["reason"] }
      : { ok: false, reason: "invalid_response" };
  }
  if (record["ok"] !== true) {
    return null;
  }
  const snapshot = parseSdkGatewaySettingsSnapshot(record["snapshot"]);
  if (snapshot === null) {
    return null;
  }

  return { ok: true, snapshot };
}
