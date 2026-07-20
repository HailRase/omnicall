/**
 * Fail-closed snapshot field parsers for SDK gateway Settings IPC (DI-09 Low hygiene).
 * Reconstructs allowlisted shapes only — unknown/secret keys never pass through.
 */

import type {
  SdkGatewayDiagnosticsProjection,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
  SdkGatewaySettingsSnapshot,
} from "./SdkGatewaySettingsContract.js";

const MAX_ID_LENGTH = 128;
const MAX_ORIGINS = 64;
const MAX_ORIGIN_LENGTH = 253;
const MAX_LABEL_LENGTH = 256;
const MAX_PAIRED = 256;
const MAX_PENDING = 64;
const FORBIDDEN_KEY = /password|apikey|token|privatekey|secret|bearer/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasForbiddenKey(record: Record<string, unknown>): boolean {
  return Object.keys(record).some((key) => FORBIDDEN_KEY.test(key));
}

function parseExactOrigin(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_ORIGIN_LENGTH) {
    return null;
  }
  if (trimmed.toLowerCase() === "null" || trimmed.includes("*")) {
    return null;
  }
  return trimmed;
}

function parseId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_ID_LENGTH) {
    return null;
  }
  return trimmed;
}

function parseLabel(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  if (value.length === 0 || value.length > MAX_LABEL_LENGTH) {
    return null;
  }
  return value;
}

function parseNonNegativeInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export function parseDiagnosticsProjection(
  value: unknown,
): SdkGatewayDiagnosticsProjection | null {
  if (!isPlainObject(value) || hasForbiddenKey(value)) {
    return null;
  }
  const status = value["status"];
  const bindHost = value["bindHost"];
  const bindPort = value["bindPort"];
  const connectionCount = parseNonNegativeInt(value["connectionCount"]);
  const authenticatedCount = parseNonNegativeInt(value["authenticatedCount"]);
  const unauthenticatedCount = parseNonNegativeInt(value["unauthenticatedCount"]);
  const pendingPairingCount = parseNonNegativeInt(value["pendingPairingCount"]);
  const pairedClientCount = parseNonNegativeInt(value["pairedClientCount"]);
  const allowedOriginsCount = parseNonNegativeInt(value["allowedOriginsCount"]);
  const lastErrorCode = value["lastErrorCode"];
  const parsedBindPort =
    bindPort === null
      ? null
      : typeof bindPort === "number" &&
          Number.isInteger(bindPort) &&
          bindPort >= 0 &&
          bindPort <= 65535
        ? bindPort
        : undefined;
  if (
    (status !== "disabled" && status !== "listening") ||
    !(typeof bindHost === "string" || bindHost === null) ||
    parsedBindPort === undefined ||
    connectionCount === null ||
    authenticatedCount === null ||
    unauthenticatedCount === null ||
    pendingPairingCount === null ||
    pairedClientCount === null ||
    allowedOriginsCount === null ||
    !(typeof lastErrorCode === "string" || lastErrorCode === null) ||
    value["windowHideAvailable"] !== false
  ) {
    return null;
  }
  return {
    status,
    bindHost,
    bindPort: parsedBindPort,
    connectionCount,
    authenticatedCount,
    unauthenticatedCount,
    pendingPairingCount,
    pairedClientCount,
    allowedOriginsCount,
    lastErrorCode,
    windowHideAvailable: false,
  };
}

export function parsePairedClientProjection(
  value: unknown,
): SdkPairedClientProjection | null {
  if (!isPlainObject(value) || hasForbiddenKey(value)) {
    return null;
  }
  const clientId = parseId(value["clientId"]);
  const origin = parseExactOrigin(value["origin"]);
  const profile = parseLabel(value["profile"]);
  const applicationName = parseLabel(value["applicationName"]);
  const createdAt = parseLabel(value["createdAt"]);
  const capabilityCount = parseNonNegativeInt(value["capabilityCount"]);
  const expiresAt = value["expiresAt"];
  if (
    clientId === null ||
    origin === null ||
    profile === null ||
    applicationName === null ||
    createdAt === null ||
    capabilityCount === null ||
    typeof value["revoked"] !== "boolean" ||
    !(typeof expiresAt === "string" || expiresAt === null)
  ) {
    return null;
  }
  return {
    clientId,
    origin,
    profile,
    applicationName,
    createdAt,
    expiresAt,
    revoked: value["revoked"],
    capabilityCount,
  };
}

export function parsePendingPairingProjection(
  value: unknown,
): SdkPendingPairingProjection | null {
  if (!isPlainObject(value) || hasForbiddenKey(value)) {
    return null;
  }
  const pairingRequestId = parseId(value["pairingRequestId"]);
  const clientId = parseId(value["clientId"]);
  const origin = parseExactOrigin(value["origin"]);
  const applicationName = parseLabel(value["applicationName"]);
  const profile = parseLabel(value["profile"]);
  const expiresAt = parseLabel(value["expiresAt"]);
  if (
    pairingRequestId === null ||
    clientId === null ||
    origin === null ||
    applicationName === null ||
    profile === null ||
    expiresAt === null
  ) {
    return null;
  }
  return {
    pairingRequestId,
    clientId,
    origin,
    applicationName,
    profile,
    expiresAt,
  };
}

/**
 * - Purpose: parse Settings snapshot fields with allowlisted reconstruction.
 */
export function parseSdkGatewaySettingsSnapshot(
  value: unknown,
): SdkGatewaySettingsSnapshot | null {
  if (!isPlainObject(value) || hasForbiddenKey(value)) {
    return null;
  }
  const diagnostics = parseDiagnosticsProjection(value["diagnostics"]);
  if (diagnostics === null) {
    return null;
  }
  const originsRaw = value["allowedOrigins"];
  const pairedRaw = value["pairedClients"];
  const pendingRaw = value["pendingPairing"];
  if (
    !Array.isArray(originsRaw) ||
    originsRaw.length > MAX_ORIGINS ||
    !Array.isArray(pairedRaw) ||
    pairedRaw.length > MAX_PAIRED ||
    !Array.isArray(pendingRaw) ||
    pendingRaw.length > MAX_PENDING
  ) {
    return null;
  }

  const allowedOrigins: string[] = [];
  for (const entry of originsRaw) {
    const origin = parseExactOrigin(entry);
    if (origin === null) {
      return null;
    }
    allowedOrigins.push(origin);
  }

  const pairedClients: SdkPairedClientProjection[] = [];
  for (const entry of pairedRaw) {
    const client = parsePairedClientProjection(entry);
    if (client === null) {
      return null;
    }
    pairedClients.push(client);
  }

  const pendingPairing: SdkPendingPairingProjection[] = [];
  for (const entry of pendingRaw) {
    const pending = parsePendingPairingProjection(entry);
    if (pending === null) {
      return null;
    }
    pendingPairing.push(pending);
  }

  return {
    diagnostics,
    allowedOrigins,
    pairedClients,
    pendingPairing,
  };
}
