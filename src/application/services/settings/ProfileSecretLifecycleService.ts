import {
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
  createSecretStorageScopeKey,
  type SecretStoragePort,
} from "@ports/secrets/SecretStoragePort.js";

const PROFILE_SECRET_IDS = [
  SIP_PASSWORD_SECRET_ID,
  OCP_PROXY_API_KEY_SECRET_ID,
] as const;

export class ProfileSecretLifecycleService {
  constructor(private readonly secretStorage: SecretStoragePort) {}

  async deleteAllScopes(scopeValues: ReadonlyArray<string>): Promise<void> {
    const uniqueScopes = [...new Set(scopeValues.map((value) => value.trim()))].filter(
      (value) => value.length > 0,
    );
    const results = await Promise.allSettled(
      uniqueScopes.flatMap((scopeValue) => {
        const scopeKey = createSecretStorageScopeKey(scopeValue);
        return PROFILE_SECRET_IDS.map((secretId) =>
          this.secretStorage.deleteSecret(scopeKey, secretId),
        );
      }),
    );
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") {
      throw failed.reason;
    }
  }
}
