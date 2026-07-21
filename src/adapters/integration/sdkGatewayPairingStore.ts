/**
 * Secure paired-client persistence via SecretStoragePort (DI-04 / ADR-0011).
 */

import {
  CAPABILITY_IDS,
  PAIRING_PROFILES,
  type CapabilityId,
  type PairingProfile,
} from "@axata/axatalk-protocol";
import type { SecretStoragePort } from "@ports/secrets/SecretStoragePort.js";
import {
  createSecretStorageScopeKey,
  SDK_PAIRED_CLIENT_SECRET_ID_PREFIX,
  SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
  SDK_PAIRING_SCOPE_KEY,
} from "@ports/secrets/SecretStoragePort.js";

import type {
  SdkPairedClientPublicMeta,
  SdkPairedClientRecord,
} from "./sdkGatewayPairingTypes.js";

const scopeKey = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);
const PROFILE_SET = new Set<string>(PAIRING_PROFILES);
const CAPABILITY_SET = new Set<string>(CAPABILITY_IDS);

function clientSecretId(clientId: string): string {
  return `${SDK_PAIRED_CLIENT_SECRET_ID_PREFIX}${clientId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseClientIds(raw: string | null): string[] {
  if (raw === null || raw.length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
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

function parseRecord(raw: string | null): SdkPairedClientRecord | null {
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

export class SdkGatewayPairingStore {
  constructor(private readonly secrets: SecretStoragePort) {}

  async get(clientId: string): Promise<SdkPairedClientRecord | null> {
    return parseRecord(
      await this.secrets.loadSecret(scopeKey, clientSecretId(clientId)),
    );
  }

  async listPublic(): Promise<readonly SdkPairedClientPublicMeta[]> {
    const ids = parseClientIds(
      await this.secrets.loadSecret(scopeKey, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    const out: SdkPairedClientPublicMeta[] = [];
    for (const clientId of ids) {
      const record = await this.get(clientId);
      if (record !== null) {
        out.push(toPublicMeta(record));
      }
    }
    return out;
  }

  async save(record: SdkPairedClientRecord): Promise<void> {
    await this.secrets.saveSecret(
      scopeKey,
      clientSecretId(record.clientId),
      JSON.stringify(record),
    );
    const ids = parseClientIds(
      await this.secrets.loadSecret(scopeKey, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    if (!ids.includes(record.clientId)) {
      ids.push(record.clientId);
      await this.secrets.saveSecret(
        scopeKey,
        SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
        JSON.stringify(ids),
      );
    }
  }

  async revoke(clientId: string, revokedAt: string): Promise<boolean> {
    const existing = await this.get(clientId);
    if (existing === null) {
      return false;
    }
    await this.save({ ...existing, revokedAt });
    return true;
  }

  async findActive(
    clientId: string,
    origin: string,
    nowMs: number,
  ): Promise<SdkPairedClientRecord | null> {
    const record = await this.get(clientId);
    if (record === null || record.origin !== origin) {
      return null;
    }
    if (record.revokedAt !== null) {
      return null;
    }
    if (record.expiresAt !== null && Date.parse(record.expiresAt) <= nowMs) {
      return null;
    }
    return record;
  }
}

function toPublicMeta(record: SdkPairedClientRecord): SdkPairedClientPublicMeta {
  return {
    clientId: record.clientId,
    origin: record.origin,
    profile: record.profile,
    grantedCapabilities: record.grantedCapabilities,
    applicationName: record.applicationName,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    revoked: record.revokedAt !== null,
  };
}
