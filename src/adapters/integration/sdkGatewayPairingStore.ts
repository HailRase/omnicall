/**
 * Secure paired-client persistence via SecretStoragePort (DI-04 / ADR-0011 / ADR-0027).
 *
 * Storage identity is Origin+clientId (v2 digest secret id). Legacy clientId-only
 * blobs migrate on touch when stored Origin exactly matches; never cross-Origin merge.
 * Corrupt / undecryptable blobs are purged (fail-closed for that binding).
 */

import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { SecretStoragePort } from "@ports/secrets/SecretStoragePort.js";
import {
  createSecretStorageScopeKey,
  SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
  SDK_PAIRING_SCOPE_KEY,
} from "@ports/secrets/SecretStoragePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

import {
  parsePairedClientIndexEntries,
  parsePairedClientRecord,
} from "./sdkGatewayPairingRecordParse.js";
import {
  buildLegacySdkPairedClientSecretId,
  buildSdkPairedClientSecretId,
  indexEntryKey,
  type SdkPairedClientIndexEntry,
} from "./sdkGatewayPairingSecretIds.js";
import type {
  SdkPairedClientPublicMeta,
  SdkPairedClientRecord,
} from "./sdkGatewayPairingTypes.js";

const scopeKey = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

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

export class SdkGatewayPairingStore {
  constructor(private readonly secrets: SecretStoragePort) {}

  async get(
    clientId: string,
    origin: string,
  ): Promise<SdkPairedClientRecord | null> {
    return this.loadBinding(clientId, origin, true);
  }

  async listPublic(): Promise<readonly SdkPairedClientPublicMeta[]> {
    const entries = parsePairedClientIndexEntries(
      await loadPairingSecret(this.secrets, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    const out: SdkPairedClientPublicMeta[] = [];
    const nextIndex: SdkPairedClientIndexEntry[] = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      const record = await this.resolveIndexEntry(entry);
      if (record === null || record.revokedAt !== null) {
        if (entry.origin.length > 0) {
          await this.remove(entry.clientId, entry.origin);
        } else if (record !== null) {
          await this.remove(record.clientId, record.origin);
        } else {
          await this.purgeLegacyClientId(entry.clientId);
        }
        continue;
      }
      const key = indexEntryKey({
        clientId: record.clientId,
        origin: record.origin,
      });
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      nextIndex.push({ clientId: record.clientId, origin: record.origin });
      out.push(toPublicMeta(record));
    }

    await this.writeIndex(nextIndex);
    return out;
  }

  async save(record: SdkPairedClientRecord): Promise<void> {
    const compositeId = buildSdkPairedClientSecretId(
      record.origin,
      record.clientId,
    );
    await this.secrets.saveSecret(scopeKey, compositeId, JSON.stringify(record));
    await this.upsertIndexEntry({
      clientId: record.clientId,
      origin: record.origin,
    });
    await this.deleteLegacyIfOriginMatches(record.clientId, record.origin);
  }

  /** Revoke = hard delete for Origin+clientId binding. */
  async revoke(clientId: string, origin: string): Promise<boolean> {
    return this.remove(clientId, origin);
  }

  async remove(clientId: string, origin: string): Promise<boolean> {
    const existing = await this.loadBinding(clientId, origin, false);
    const compositeId = buildSdkPairedClientSecretId(origin, clientId);
    const legacyId = buildLegacySdkPairedClientSecretId(clientId);
    const compositeRaw = await loadPairingSecret(this.secrets, compositeId);
    const legacy = parsePairedClientRecord(
      await loadPairingSecret(this.secrets, legacyId),
    );
    const legacyMatches =
      legacy !== null &&
      legacy.clientId === clientId &&
      legacy.origin === origin;

    const entries = parsePairedClientIndexEntries(
      await loadPairingSecret(this.secrets, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    const next = entries.filter((entry) => {
      if (entry.clientId !== clientId) {
        return true;
      }
      if (entry.origin === origin) {
        return false;
      }
      if (entry.origin === "" && legacyMatches) {
        return false;
      }
      return true;
    });
    const indexChanged = next.length !== entries.length;
    const hadBlob = compositeRaw !== null || legacyMatches;

    if (existing === null && !hadBlob && !indexChanged) {
      return false;
    }

    if (compositeRaw !== null) {
      await this.secrets.deleteSecret(scopeKey, compositeId);
    }
    if (legacyMatches) {
      await this.secrets.deleteSecret(scopeKey, legacyId);
    }
    if (indexChanged) {
      await this.writeIndex(next);
    }
    return true;
  }

  async findActive(
    clientId: string,
    origin: string,
    nowMs: number,
  ): Promise<SdkPairedClientRecord | null> {
    const record = await this.get(clientId, origin);
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

  /**
   * Load v2 first; migrate legacy only when stored Origin exactly matches.
   * Mismatched legacy blobs are left untouched (never cross-Origin overwrite).
   */
  private async loadBinding(
    clientId: string,
    origin: string,
    migrate: boolean,
  ): Promise<SdkPairedClientRecord | null> {
    const compositeId = buildSdkPairedClientSecretId(origin, clientId);
    const composite = parsePairedClientRecord(
      await loadPairingSecret(this.secrets, compositeId),
    );
    if (composite !== null) {
      if (composite.clientId !== clientId || composite.origin !== origin) {
        await this.secrets.deleteSecret(scopeKey, compositeId);
        return null;
      }
      if (migrate) {
        await this.deleteLegacyIfOriginMatches(clientId, origin);
      }
      return composite;
    }

    const legacyId = buildLegacySdkPairedClientSecretId(clientId);
    const legacy = parsePairedClientRecord(
      await loadPairingSecret(this.secrets, legacyId),
    );
    if (legacy === null) {
      return null;
    }
    if (legacy.clientId !== clientId) {
      await this.secrets.deleteSecret(scopeKey, legacyId);
      return null;
    }
    if (legacy.origin !== origin) {
      return null;
    }
    if (!migrate) {
      return legacy;
    }
    await this.secrets.saveSecret(
      scopeKey,
      compositeId,
      JSON.stringify(legacy),
    );
    await this.upsertIndexEntry({ clientId, origin });
    await this.secrets.deleteSecret(scopeKey, legacyId);
    return legacy;
  }

  private async resolveIndexEntry(
    entry: SdkPairedClientIndexEntry,
  ): Promise<SdkPairedClientRecord | null> {
    if (entry.origin.length > 0) {
      return this.get(entry.clientId, entry.origin);
    }
    const legacyId = buildLegacySdkPairedClientSecretId(entry.clientId);
    const legacy = parsePairedClientRecord(
      await loadPairingSecret(this.secrets, legacyId),
    );
    if (legacy === null) {
      return null;
    }
    return this.get(legacy.clientId, legacy.origin);
  }

  private async deleteLegacyIfOriginMatches(
    clientId: string,
    origin: string,
  ): Promise<void> {
    const legacyId = buildLegacySdkPairedClientSecretId(clientId);
    const legacy = parsePairedClientRecord(
      await loadPairingSecret(this.secrets, legacyId),
    );
    if (legacy === null) {
      return;
    }
    if (legacy.origin !== origin || legacy.clientId !== clientId) {
      return;
    }
    await this.secrets.deleteSecret(scopeKey, legacyId);
  }

  private async upsertIndexEntry(
    entry: SdkPairedClientIndexEntry,
  ): Promise<void> {
    const entries = parsePairedClientIndexEntries(
      await loadPairingSecret(this.secrets, SDK_PAIRED_CLIENTS_INDEX_SECRET_ID),
    );
    const key = indexEntryKey(entry);
    const next: SdkPairedClientIndexEntry[] = [];
    const seen = new Set<string>();
    for (const row of entries) {
      if (row.origin.length === 0) {
        if (row.clientId === entry.clientId) {
          continue;
        }
        const legacyKey = `\0${row.clientId}`;
        if (seen.has(legacyKey)) {
          continue;
        }
        seen.add(legacyKey);
        next.push(row);
        continue;
      }
      const rowKey = indexEntryKey(row);
      if (seen.has(rowKey)) {
        continue;
      }
      seen.add(rowKey);
      next.push(row);
    }
    if (!seen.has(key)) {
      next.push(entry);
    }
    await this.writeIndex(next);
  }

  private async writeIndex(
    entries: readonly SdkPairedClientIndexEntry[],
  ): Promise<void> {
    await this.secrets.saveSecret(
      scopeKey,
      SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
      JSON.stringify(entries),
    );
  }

  /** Drop orphan legacy clientId blob/index row when resolve fails closed. */
  private async purgeLegacyClientId(clientId: string): Promise<void> {
    const legacyId = buildLegacySdkPairedClientSecretId(clientId);
    try {
      await this.secrets.deleteSecret(scopeKey, legacyId);
    } catch {
      // Best-effort; index rewrite drops the row.
    }
  }
}
