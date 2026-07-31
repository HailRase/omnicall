/**
 * Secure paired-client persistence via SecretStoragePort (DI-04 / ADR-0011).
 *
 * Corrupt / undecryptable blobs are purged and treated as missing so Settings
 * and gateway auth stay available; clients must re-pair (fail-closed for that
 * binding). SIP/account secrets are out of scope — they keep hard failures.
 */

import {
  CAPABILITY_IDS,
  PAIRING_PROFILES,
  type CapabilityId,
  type PairingProfile,
} from "@softomnitel/omnicall-protocol";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { SecretStoragePort } from "@ports/secrets/SecretStoragePort.js";
import {
  createSecretStorageScopeKey,
  SDK_PAIRED_CLIENT_SECRET_ID_PREFIX,
  SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
  SDK_PAIRING_SCOPE_KEY,
} from "@ports/secrets/SecretStoragePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

import type {
  SdkPairedClientPublicMeta,
  SdkPairedClientRecord,
} from "./sdkGatewayPairingTypes.js";

const scopeKey = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);
const PROFILE_SET = new Set<string>(PAIRING_PROFILES);
const CAPABILITY_SET = new Set<string>(CAPABILITY_IDS);

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

function clientSecretId(clientId: string): string {
  return `${SDK_PAIRED_CLIENT_SECRET_ID_PREFIX}${clientId}`;
}

/**
 * Load pairing secret; on storage failure purge the blob and return null.
 * Does not swallow SIP-scope errors — this helper is pairing-scope only.
 */
async function loadPairingSecret(
  secrets: SecretStoragePort,
  secretId: string,
): Promise<string | null> {
  try {
    return await secrets.loadSecret(scopeKey, secretId);
  } catch (error: unknown) {
    logger.warn("sdk_pairing_secret_load_recovered", {
      correlationId: createCorrelationId(),
      operation: "sdk_pairing_store_load",
      result: error instanceof Error ? error.message : "secret_load_failed",
    });
    try {
      await secrets.deleteSecret(scopeKey, secretId);
    } catch {
      // Best-effort purge; next load still returns null via catch.
    }
    return null;
  }
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
      await loadPairingSecret(this.secrets, clientSecretId(clientId)),
    );
  }

  async listPublic(): Promise<readonly SdkPairedClientPublicMeta[]> {
    const ids = parseClientIds(
      await loadPairingSecret(this.secrets, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    const out: SdkPairedClientPublicMeta[] = [];
    const staleIds: string[] = [];
    for (const clientId of ids) {
      const record = await this.get(clientId);
      if (record === null || record.revokedAt !== null) {
        // Drop missing / legacy soft-revoked / corrupt rows — must not linger in UI.
        staleIds.push(clientId);
        continue;
      }
      out.push(toPublicMeta(record));
    }
    for (const clientId of staleIds) {
      await this.remove(clientId);
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
      await loadPairingSecret(this.secrets, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
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

  /**
   * Revoke = hard delete. Soft-revoked tombstones are noise; wire still emits sdk:revoked
   * via session close before the record disappears.
   */
  async revoke(clientId: string): Promise<boolean> {
    return this.remove(clientId);
  }

  async remove(clientId: string): Promise<boolean> {
    const existing = await this.get(clientId);
    const ids = parseClientIds(
      await loadPairingSecret(this.secrets, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    const nextIds = ids.filter((id) => id !== clientId);
    if (existing === null && nextIds.length === ids.length) {
      return false;
    }
    await this.secrets.deleteSecret(scopeKey, clientSecretId(clientId));
    if (nextIds.length !== ids.length) {
      await this.secrets.saveSecret(
        scopeKey,
        SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
        JSON.stringify(nextIds),
      );
    }
    return existing !== null || nextIds.length !== ids.length;
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
