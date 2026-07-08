import type {
  SecretStoragePort,
  SecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";
import {
  parseSecretStorageResponse,
  type SecretStorageOperation,
} from "@shared/ipc/SecretStorageContract.js";

type SecretStorageInvoker = (operation: SecretStorageOperation) => Promise<unknown>;

/**
 * - Purpose: renderer SecretStoragePort backed by main-process safeStorage IPC.
 * - Inputs: scope key, secret id, and UTF-8 secret value.
 * - Outputs: delegated save, load, and delete via preload bridge.
 */
export class PreloadSecretStorageAdapter implements SecretStoragePort {
  private readonly invokeSecretStorage: SecretStorageInvoker;

  constructor(invokeSecretStorage?: SecretStorageInvoker) {
    this.invokeSecretStorage =
      invokeSecretStorage ??
      ((operation) => window.softphone.invokeSecretStorage(operation));
  }

  async saveSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
    value: string,
  ): Promise<void> {
    await this.invokeOperation({ op: "save", scopeKey, secretId, value });
  }

  async loadSecret(scopeKey: SecretStorageScopeKey, secretId: string): Promise<string | null> {
    const response = await this.invokeOperation({ op: "load", scopeKey, secretId });
    return response.value ?? null;
  }

  async deleteSecret(scopeKey: SecretStorageScopeKey, secretId: string): Promise<void> {
    await this.invokeOperation({ op: "delete", scopeKey, secretId });
  }

  private async invokeOperation(
    operation: SecretStorageOperation,
  ): Promise<Extract<NonNullable<ReturnType<typeof parseSecretStorageResponse>>, { ok: true }>> {
    const rawResponse = await this.invokeSecretStorage(operation);
    const parsed = parseSecretStorageResponse(rawResponse);
    if (parsed === null || !parsed.ok) {
      const reason = parsed?.reason ?? "invalid_secret_storage_response";
      throw new Error(reason);
    }
    return parsed;
  }
}
