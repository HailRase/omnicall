/**
 * Typed IPC contract for SDK gateway Settings / operational UX (DI-09).
 * Payloads are allowlisted — no secrets, public keys, or reusable bearers.
 */

import { parseSdkGatewaySettingsSnapshot } from "./parseSdkGatewaySettingsSnapshot.js";

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
  /** ADR-0013: hide remains product-unavailable. */
  windowHideAvailable: false;
}>;

export type SdkActivateGrantResultProjection =
  | Readonly<{ ok: true; profileRef: string }>
  | Readonly<{
      ok: false;
      reason: "not_listening" | "invalid_profile" | "ref_too_long" | "ipc_failed";
    }>;

export type SdkGatewaySettingsPolicyPayload = Readonly<{
  enabled: boolean;
  allowedOrigins: readonly string[];
  originsManaged: boolean;
}>;

export type SdkGatewaySettingsOperation =
  | Readonly<{ op: "getSnapshot" }>
  | Readonly<{ op: "applyPolicy"; policy: SdkGatewaySettingsPolicyPayload }>
  | Readonly<{ op: "approvePairing"; pairingRequestId: string }>
  | Readonly<{ op: "denyPairing"; pairingRequestId: string }>
  | Readonly<{ op: "revokeClient"; clientId: string }>
  | Readonly<{
      op: "issueActivateGrant";
      clientId: string;
      profileId: string;
    }>;

export type SdkGatewaySettingsSnapshot = Readonly<{
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOrigins: readonly string[];
  pairedClients: readonly SdkPairedClientProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
}>;

export type SdkGatewaySettingsResponse =
  | Readonly<{ ok: true; snapshot: SdkGatewaySettingsSnapshot }>
  | Readonly<{
      ok: true;
      grant: SdkActivateGrantResultProjection;
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
  if (typeof record["enabled"] !== "boolean") {
    return null;
  }
  if (typeof record["originsManaged"] !== "boolean") {
    return null;
  }
  const originsRaw = record["allowedOrigins"];
  if (!Array.isArray(originsRaw) || originsRaw.length > MAX_ORIGINS) {
    return null;
  }
  const allowedOrigins: string[] = [];
  for (const entry of originsRaw) {
    if (typeof entry !== "string") {
      return null;
    }
    const trimmed = entry.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_ORIGIN_LENGTH) {
      return null;
    }
    if (trimmed.toLowerCase() === "null" || trimmed.includes("*")) {
      return null;
    }
    allowedOrigins.push(trimmed);
  }
  return {
    enabled: record["enabled"],
    allowedOrigins,
    originsManaged: record["originsManaged"],
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
      if (!isNonEmptyString(clientId) || clientId.length > MAX_ID_LENGTH) {
        return null;
      }
      return { op, clientId: clientId.trim() };
    }
    case "issueActivateGrant": {
      const clientId = record["clientId"];
      const profileId = record["profileId"];
      if (
        !isNonEmptyString(clientId) ||
        !isNonEmptyString(profileId) ||
        clientId.length > MAX_ID_LENGTH ||
        profileId.length > MAX_ID_LENGTH
      ) {
        return null;
      }
      return {
        op,
        clientId: clientId.trim(),
        profileId: profileId.trim(),
      };
    }
    default:
      return null;
  }
}

function parseGrant(
  value: unknown,
): SdkActivateGrantResultProjection | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const g = value as Record<string, unknown>;
  if (Object.keys(g).some((key) => /password|apikey|token|privatekey|secret|bearer/i.test(key))) {
    return null;
  }
  if (g["ok"] === true && typeof g["profileRef"] === "string") {
    const profileRef = g["profileRef"].trim();
    if (profileRef.length === 0 || profileRef.length > MAX_ID_LENGTH) {
      return null;
    }
    return { ok: true, profileRef };
  }
  if (
    g["ok"] === false &&
    (g["reason"] === "not_listening" ||
      g["reason"] === "invalid_profile" ||
      g["reason"] === "ref_too_long" ||
      g["reason"] === "ipc_failed")
  ) {
    return { ok: false, reason: g["reason"] };
  }
  return null;
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

  if ("grant" in record) {
    const grant = parseGrant(record["grant"]);
    if (grant === null) {
      return null;
    }
    return { ok: true, grant, snapshot };
  }

  return { ok: true, snapshot };
}
