/**
 * - Purpose: move SIP/OCP secrets from provisional username-only key to SIP profile key.
 * - Inputs: SecretStoragePort + source/target scope keys.
 * - Outputs: best-effort copy then delete source (never logs secret values).
 */

import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
  type SecretStoragePort,
  type SecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

const SECRET_IDS = [SIP_PASSWORD_SECRET_ID, OCP_PROXY_API_KEY_SECRET_ID] as const;

export type MigrateProfileScopedSecretsInput = Readonly<{
  secretStorage: SecretStoragePort;
  fromScopeKey: string;
  toScopeKey: string;
  logger: Logger;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: avoid duplicate secrets when OCP provisional key becomes a SIP profile id.
 */
export async function migrateProfileScopedSecrets(
  input: MigrateProfileScopedSecretsInput,
): Promise<void> {
  if (input.fromScopeKey === input.toScopeKey) {
    return;
  }

  const fromKey = createSecretStorageScopeKey(input.fromScopeKey);
  const toKey = createSecretStorageScopeKey(input.toScopeKey);

  for (const secretId of SECRET_IDS) {
    await migrateOneSecret({
      secretStorage: input.secretStorage,
      fromKey,
      toKey,
      secretId,
      logger: input.logger,
      ...(input.correlationId !== undefined
        ? { correlationId: input.correlationId }
        : {}),
    });
  }
}

async function migrateOneSecret(input: Readonly<{
  secretStorage: SecretStoragePort;
  fromKey: SecretStorageScopeKey;
  toKey: SecretStorageScopeKey;
  secretId: string;
  logger: Logger;
  correlationId?: CorrelationId;
}>): Promise<void> {
  const value = await input.secretStorage.loadSecret(input.fromKey, input.secretId);
  if (value === null || value.length === 0) {
    return;
  }

  const existing = await input.secretStorage.loadSecret(input.toKey, input.secretId);
  if (existing === null || existing.length === 0) {
    await input.secretStorage.saveSecret(input.toKey, input.secretId, value);
  }

  // SIP password moves to the successful SIP key. OCP API key is linked (copied)
  // without deleting the provisional scope so Integrations login lookup still works
  // until a saved profile id replaces the provisional key (WU-03/WU-04).
  if (input.secretId === SIP_PASSWORD_SECRET_ID) {
    await input.secretStorage.deleteSecret(input.fromKey, input.secretId);
  }

  input.logger.info("profile_scoped_secret_migrated", {
    ...(input.correlationId !== undefined
      ? { correlationId: input.correlationId }
      : {}),
    featureId: "F-024",
    boundedContext: "Settings",
    operation: "migrate_profile_scoped_secret",
    result: "succeeded",
    secretId: input.secretId,
  });
}
