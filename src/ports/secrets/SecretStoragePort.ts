/**
 * - Purpose: scope key for secret storage buckets (typically profile key).
 * - Inputs: branded string identifier.
 * - Outputs: opaque SecretStorageScopeKey.
 */
export type SecretStorageScopeKey = string & { readonly __brand: "SecretStorageScopeKey" };

/**
 * - Purpose: persist sensitive credentials outside profile JSON files.
 * - Inputs: scope key, secret id, UTF-8 secret value.
 * - Outputs: save, load, delete operations via adapter implementations.
 */
export interface SecretStoragePort {
  saveSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
    value: string,
  ): Promise<void>;
  loadSecret(scopeKey: SecretStorageScopeKey, secretId: string): Promise<string | null>;
  deleteSecret(scopeKey: SecretStorageScopeKey, secretId: string): Promise<void>;
}

/**
 * - Purpose: brand secret storage scope from profile key string.
 * - Inputs: profile or account key string.
 * - Outputs: branded SecretStorageScopeKey.
 */
export function createSecretStorageScopeKey(value: string): SecretStorageScopeKey {
  return value as SecretStorageScopeKey;
}

/** Canonical secret id for SIP password when secure storage is enabled. */
export const SIP_PASSWORD_SECRET_ID = "sip-password" as const;

/** Legacy secret id removed in F-028 HTTP auth — migration cleanup only. */
export const LEGACY_OCP_TOKEN_SECRET_ID = "ocp-token" as const;

/** Canonical secret id for OCP Proxy API key (never persisted in UserSettings JSON). */
export const OCP_PROXY_API_KEY_SECRET_ID = "ocp-proxy-api-key" as const;

/** Secret-storage scope for SDK gateway paired clients (DI-04). */
export const SDK_PAIRING_SCOPE_KEY = "sdk-gateway" as const;

/** Index blob listing paired client IDs (JSON string array). */
export const SDK_PAIRED_CLIENTS_INDEX_SECRET_ID = "paired-clients-index" as const;

/** Prefix for per-client pairing binding blobs (`paired-client:<clientId>`). */
export const SDK_PAIRED_CLIENT_SECRET_ID_PREFIX = "paired-client:" as const;
