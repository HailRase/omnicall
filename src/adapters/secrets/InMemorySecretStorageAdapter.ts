import type {
  SecretStoragePort,
  SecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";

type SecretBucket = Map<string, string>;

/**
 * - Purpose: in-memory SecretStoragePort for tests and mock bootstrap.
 * - Inputs: scope key, secret id, and UTF-8 secret value.
 * - Outputs: save, load, and delete operations isolated per scope bucket.
 */
export class InMemorySecretStorageAdapter implements SecretStoragePort {
  private readonly buckets = new Map<string, SecretBucket>();

  saveSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
    value: string,
  ): Promise<void> {
    const bucket = this.getOrCreateBucket(scopeKey);
    bucket.set(secretId, value);
    return Promise.resolve();
  }

  loadSecret(scopeKey: SecretStorageScopeKey, secretId: string): Promise<string | null> {
    const bucket = this.buckets.get(scopeKey);
    if (bucket === undefined) {
      return Promise.resolve(null);
    }
    return Promise.resolve(bucket.get(secretId) ?? null);
  }

  deleteSecret(scopeKey: SecretStorageScopeKey, secretId: string): Promise<void> {
    const bucket = this.buckets.get(scopeKey);
    if (bucket === undefined) {
      return Promise.resolve();
    }
    bucket.delete(secretId);
    if (bucket.size === 0) {
      this.buckets.delete(scopeKey);
    }
    return Promise.resolve();
  }

  private getOrCreateBucket(scopeKey: SecretStorageScopeKey): SecretBucket {
    const existing = this.buckets.get(scopeKey);
    if (existing !== undefined) {
      return existing;
    }

    const created: SecretBucket = new Map();
    this.buckets.set(scopeKey, created);
    return created;
  }
}
