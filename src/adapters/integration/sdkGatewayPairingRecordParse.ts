/**
 * - Purpose: parse pairing store blobs and index rows.
 * - Inputs: raw secret JSON strings / unknown index values.
 * - Outputs: typed records, index entries, or null/empty on corrupt input.
 */

import {
  CAPABILITY_IDS,
  PAIRING_PROFILES,
  type CapabilityId,
  type PairingProfile,
} from "@softomnitel/omnicall-protocol";

import type { SdkPairedClientIndexEntry } from "./sdkGatewayPairingSecretIds.js";
import type { SdkPairedClientRecord } from "./sdkGatewayPairingTypes.js";

const PROFILE_SET = new Set<string>(PAIRING_PROFILES);
const CAPABILITY_SET = new Set<string>(CAPABILITY_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProfile(value: unknown): PairingProfile | null {
  return typeof value === "string" && PROFILE_SET.has(value)
    ? (value as PairingProfile)
    : null;
}

function parseCapabilities(value: unknown): readonly CapabilityId[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const caps: CapabilityId[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !CAPABILITY_SET.has(item)) {
      return null;
    }
    caps.push(item as CapabilityId);
  }
  return caps;
}

function parseNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export function parsePairedClientIndexEntries(
  raw: string | null,
): SdkPairedClientIndexEntry[] {
  if (raw === null || raw.length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: SdkPairedClientIndexEntry[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && item.length > 0) {
        out.push({ clientId: item, origin: "" });
        continue;
      }
      if (!isRecord(item)) {
        continue;
      }
      const clientId = item["clientId"];
      const origin = item["origin"];
      if (
        typeof clientId === "string" &&
        clientId.length > 0 &&
        typeof origin === "string" &&
        origin.length > 0
      ) {
        out.push({ clientId, origin });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function parsePairedClientRecord(
  raw: string | null,
): SdkPairedClientRecord | null {
  if (raw === null || raw.length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    const profile = parseProfile(parsed["profile"]);
    const caps = parseCapabilities(parsed["grantedCapabilities"]);
    const expiresAt = parseNullableString(parsed["expiresAt"]);
    const revokedAt = parseNullableString(parsed["revokedAt"]);
    if (
      typeof parsed["clientId"] !== "string" ||
      typeof parsed["origin"] !== "string" ||
      typeof parsed["publicKey"] !== "string" ||
      parsed["keyAlgorithm"] !== "ECDSA-P256-SHA256" ||
      profile === null ||
      caps === null ||
      typeof parsed["applicationName"] !== "string" ||
      typeof parsed["applicationVersion"] !== "string" ||
      typeof parsed["createdAt"] !== "string" ||
      expiresAt === undefined ||
      revokedAt === undefined
    ) {
      return null;
    }
    return {
      clientId: parsed["clientId"],
      origin: parsed["origin"],
      publicKey: parsed["publicKey"],
      keyAlgorithm: "ECDSA-P256-SHA256",
      profile,
      grantedCapabilities: caps,
      applicationName: parsed["applicationName"],
      applicationVersion: parsed["applicationVersion"],
      createdAt: parsed["createdAt"],
      expiresAt,
      revokedAt,
    };
  } catch {
    return null;
  }
}
