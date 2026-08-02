/**
 * - Purpose: Origin+clientId pairing secret ids (ADR-0027 WU-05).
 * - Inputs: exact Origin string, clientId.
 * - Outputs: v2 digest id; legacy clientId-only id for migration.
 */

import { createHash } from "node:crypto";
import {
  SDK_PAIRED_CLIENT_SECRET_ID_PREFIX,
  SDK_PAIRED_CLIENT_V2_SECRET_ID_PREFIX,
} from "@ports/secrets/SecretStoragePort.js";

/** SHA-256 hex of exact Origin — never embed raw Origin in storage ids. */
export function digestSdkPairingOrigin(origin: string): string {
  return createHash("sha256").update(origin, "utf8").digest("hex");
}

/** Legacy DI-04 secret id (`paired-client:<clientId>`). */
export function buildLegacySdkPairedClientSecretId(clientId: string): string {
  return `${SDK_PAIRED_CLIENT_SECRET_ID_PREFIX}${clientId}`;
}

/**
 * Composite secret id for Origin+clientId.
 * Shape: `paired-client-v2:<originSha256Hex>.<encodeURIComponent(clientId)>`.
 */
export function buildSdkPairedClientSecretId(
  origin: string,
  clientId: string,
): string {
  const originDigest = digestSdkPairingOrigin(origin);
  return `${SDK_PAIRED_CLIENT_V2_SECRET_ID_PREFIX}${originDigest}.${encodeURIComponent(clientId)}`;
}

export type SdkPairedClientIndexEntry = Readonly<{
  clientId: string;
  origin: string;
}>;

export function indexEntryKey(entry: SdkPairedClientIndexEntry): string {
  return `${entry.origin}\0${entry.clientId}`;
}
