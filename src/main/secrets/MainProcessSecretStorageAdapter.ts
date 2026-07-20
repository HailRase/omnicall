/**
 * SecretStoragePort backed by ElectronSafeStorageSecretService (main process).
 */

import type {
  SecretStoragePort,
  SecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";

import type { ElectronSafeStorageSecretService } from "./ElectronSafeStorageSecretService.js";

export class MainProcessSecretStorageAdapter implements SecretStoragePort {
  constructor(private readonly service: ElectronSafeStorageSecretService) {}

  async saveSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
    value: string,
  ): Promise<void> {
    const result = await this.service.saveSecret(scopeKey, secretId, value);
    if (!result.ok) {
      throw new Error(result.reason);
    }
  }

  async loadSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
  ): Promise<string | null> {
    const result = await this.service.loadSecret(scopeKey, secretId);
    if (!result.ok) {
      throw new Error(result.reason);
    }
    return result.value ?? null;
  }

  async deleteSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
  ): Promise<void> {
    const result = await this.service.deleteSecret(scopeKey, secretId);
    if (!result.ok) {
      throw new Error(result.reason);
    }
  }
}
