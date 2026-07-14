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

/** Canonical secret id for OCP Module auth token (never persisted in UserSettings JSON). */
export const OCP_TOKEN_SECRET_ID = "ocp-token" as const;
