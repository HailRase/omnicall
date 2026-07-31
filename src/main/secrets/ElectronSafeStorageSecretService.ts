import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { safeStorage } from "electron";
import { resolveSecretStorageFilePath } from "./resolveSecretStorageFilePath.js";

export type SecretStorageServiceResult = Readonly<
  | { ok: true; value?: string | null }
  | { ok: false; reason: string }
>;

/**
 * - Purpose: persist encrypted SIP secrets via Electron safeStorage and local blobs.
 * - Inputs: secrets root path, scope key, secret id, and UTF-8 secret value.
 * - Outputs: save, load, and delete results without exposing secret values in errors.
 */
export class ElectronSafeStorageSecretService {
  constructor(private readonly secretsRoot: string) {}

  async saveSecret(
    scopeKey: string,
    secretId: string,
    value: string,
  ): Promise<SecretStorageServiceResult> {
    if (!safeStorage.isEncryptionAvailable()) {
      return { ok: false, reason: "encryption_unavailable" };
    }

    try {
      const encrypted = safeStorage.encryptString(value);
      const filePath = resolveSecretStorageFilePath(this.secretsRoot, scopeKey, secretId);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, encrypted);
      return { ok: true };
    } catch {
      return { ok: false, reason: "secret_save_failed" };
    }
  }

  async loadSecret(scopeKey: string, secretId: string): Promise<SecretStorageServiceResult> {
    if (!safeStorage.isEncryptionAvailable()) {
      return { ok: false, reason: "encryption_unavailable" };
    }

    const filePath = resolveSecretStorageFilePath(this.secretsRoot, scopeKey, secretId);

    try {
      const encrypted = await readFile(filePath);
      const value = safeStorage.decryptString(encrypted);
      return { ok: true, value };
    } catch (error: unknown) {
      if (isMissingFileError(error)) {
        return { ok: true, value: null };
      }
      // Corrupt / foreign-key blob: purge so callers are not stuck on perpetual
      // secret_load_failed. Still report failure (SIP UX treats this as recover).
      try {
        await rm(filePath, { force: true });
      } catch {
        // Best-effort; reason remains secret_load_failed.
      }
      return { ok: false, reason: "secret_load_failed" };
    }
  }

  async deleteSecret(scopeKey: string, secretId: string): Promise<SecretStorageServiceResult> {
    const filePath = resolveSecretStorageFilePath(this.secretsRoot, scopeKey, secretId);

    try {
      await rm(filePath, { force: true });
      return { ok: true };
    } catch {
      return { ok: false, reason: "secret_delete_failed" };
    }
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
