/**
 * - Purpose: opt-in pre-auth persistence of draft profile metadata + secrets (ADR-AF-001).
 * - Inputs: profile metadata, save flags, optional SIP password / OCP API key at boundary.
 * - Outputs: draft profile id or classified failure; never logs secret values.
 */

import {
  createSavedAccountProfile,
  type SavedAccountProfile,
  type SavedAccountProfileInput,
} from "@domain/index.js";
import type { Logger, SavedAccountProfileRepository } from "@ports/index.js";
import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
  type SecretStoragePort,
} from "@ports/secrets/SecretStoragePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type PersistDraftAccountArtifactsInput = Readonly<{
  profile: SavedAccountProfileInput;
  saveProfile: boolean;
  rememberPassword: boolean;
  sipPassword?: string;
  ocpDomain?: string;
  saveOcpApiKey: boolean;
  ocpApiKey?: string;
  correlationId?: CorrelationId;
}>;

export type PersistDraftAccountArtifactsOutcome = Readonly<{
  profile: SavedAccountProfile | null;
  profileId: string;
}>;

export class PersistDraftAccountArtifactsUseCase {
  constructor(
    private readonly savedAccountProfileRepository: SavedAccountProfileRepository,
    private readonly secretStoragePort: SecretStoragePort,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: PersistDraftAccountArtifactsInput,
  ): Promise<Result<PersistDraftAccountArtifactsOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const validation = createSavedAccountProfile(input.profile);
    if (!validation.ok) {
      return err(
        createPlatformError(
          "validation_failed",
          "Invalid saved account profile input",
          validation.errors,
        ),
      );
    }

    const profileId = validation.value.id;
    const optedIn =
      input.saveProfile || input.rememberPassword || input.saveOcpApiKey;
    if (!optedIn) {
      return ok({ profile: null, profileId });
    }

    const rememberCheck = validateRememberPasswordOption(input);
    if (rememberCheck !== null) {
      return err(rememberCheck);
    }

    const apiKeyCheck = validateOcpApiKeyOption(input);
    if (apiKeyCheck !== null) {
      return err(apiKeyCheck);
    }

    let savedProfile: SavedAccountProfile | null = null;
    let previousProfile: SavedAccountProfile | null = null;
    let previousSipPassword: string | null = null;
    let previousOcpApiKey: string | null = null;
    let sipPasswordWritten = false;
    let ocpApiKeyWritten = false;

    try {
      previousProfile =
        await this.savedAccountProfileRepository.getProfileById(profileId);
      const scopeKey = createSecretStorageScopeKey(profileId);
      previousSipPassword = await this.secretStoragePort.loadSecret(
        scopeKey,
        SIP_PASSWORD_SECRET_ID,
      );
      previousOcpApiKey = await this.secretStoragePort.loadSecret(
        scopeKey,
        OCP_PROXY_API_KEY_SECRET_ID,
      );

      if (input.rememberPassword) {
        const sipPassword = input.sipPassword?.trim() ?? "";
        if (sipPassword.length > 0) {
          await this.secretStoragePort.saveSecret(
            scopeKey,
            SIP_PASSWORD_SECRET_ID,
            sipPassword,
          );
          sipPasswordWritten = true;
        }
      }

      if (input.saveOcpApiKey) {
        await this.secretStoragePort.saveSecret(
          scopeKey,
          OCP_PROXY_API_KEY_SECRET_ID,
          input.ocpApiKey ?? "",
        );
        ocpApiKeyWritten = true;
      }

      // Metadata is committed last so no profile points at partially written secrets.
      if (input.saveProfile) {
        savedProfile = await this.savedAccountProfileRepository.saveProfile(input.profile, {
          lifecycleStatus: "draft",
          ...(input.ocpDomain !== undefined ? { ocpDomain: input.ocpDomain } : {}),
        });
      }
    } catch (error: unknown) {
      await this.compensatePartialWrites({
        profileId,
        profileInput: input.profile,
        previousProfile,
        previousSipPassword,
        previousOcpApiKey,
        sipPasswordWritten,
        ocpApiKeyWritten,
        profileWriteRequested: input.saveProfile,
      });
      const normalized = normalizeUnknownError(error);
      this.logger.warn("draft_account_artifacts_persist_failed", {
        correlationId,
        featureId: "F-024",
        boundedContext: "Settings",
        operation: "persist_draft_account_artifacts",
        result: normalized.message,
        profileId,
      });
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to persist opted-in draft account artifacts",
          normalized,
        ),
      );
    }

    this.logger.info("draft_account_artifacts_persisted", {
      correlationId,
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "persist_draft_account_artifacts",
      result: "succeeded",
      profileId,
      saveProfile: input.saveProfile,
      rememberPassword: input.rememberPassword,
      saveOcpApiKey: input.saveOcpApiKey,
    });

    return ok({
      profile: savedProfile,
      profileId,
    });
  }

  private async compensatePartialWrites(input: Readonly<{
    profileId: SavedAccountProfile["id"];
    profileInput: SavedAccountProfileInput;
    previousProfile: SavedAccountProfile | null;
    previousSipPassword: string | null;
    previousOcpApiKey: string | null;
    sipPasswordWritten: boolean;
    ocpApiKeyWritten: boolean;
    profileWriteRequested: boolean;
  }>): Promise<void> {
    const scopeKey = createSecretStorageScopeKey(input.profileId);
    await Promise.allSettled([
      input.sipPasswordWritten
        ? restoreSecret(
            this.secretStoragePort,
            scopeKey,
            SIP_PASSWORD_SECRET_ID,
            input.previousSipPassword,
          )
        : Promise.resolve(),
      input.ocpApiKeyWritten
        ? restoreSecret(
            this.secretStoragePort,
            scopeKey,
            OCP_PROXY_API_KEY_SECRET_ID,
            input.previousOcpApiKey,
          )
        : Promise.resolve(),
      input.profileWriteRequested
        ? restoreProfile(
            this.savedAccountProfileRepository,
            input.profileId,
            input.profileInput,
            input.previousProfile,
          )
        : Promise.resolve(),
    ]);
  }
}

function restoreSecret(
  storage: SecretStoragePort,
  scopeKey: ReturnType<typeof createSecretStorageScopeKey>,
  secretId: string,
  previousValue: string | null,
): Promise<void> {
  return previousValue === null
    ? storage.deleteSecret(scopeKey, secretId)
    : storage.saveSecret(scopeKey, secretId, previousValue);
}

async function restoreProfile(
  repository: SavedAccountProfileRepository,
  profileId: SavedAccountProfile["id"],
  profileInput: SavedAccountProfileInput,
  previousProfile: SavedAccountProfile | null,
): Promise<void> {
  if (previousProfile === null) {
    await repository.deleteProfile(profileId);
    return;
  }
  await repository.saveProfile(profileInput, {
    lifecycleStatus: previousProfile.lifecycleStatus,
    ...(previousProfile.ocpDomain !== undefined
      ? { ocpDomain: previousProfile.ocpDomain }
      : {}),
    ...(previousProfile.successfulUseAt !== undefined
      ? { successfulUseAt: previousProfile.successfulUseAt }
      : {}),
  });
}

function validateRememberPasswordOption(
  input: PersistDraftAccountArtifactsInput,
): PlatformError | null {
  if (!input.rememberPassword) {
    return null;
  }
  const password = input.sipPassword?.trim() ?? "";
  if (password.length === 0) {
    // OCP drafts may opt in before entity:creds provides a SIP password (plan: save "if available").
    if (input.ocpDomain !== undefined && input.ocpDomain.trim().length > 0) {
      return null;
    }
    return createPlatformError(
      "validation_failed",
      "SIP password is required when rememberPassword is opted in",
    );
  }
  return null;
}

function validateOcpApiKeyOption(
  input: PersistDraftAccountArtifactsInput,
): PlatformError | null {
  if (!input.saveOcpApiKey) {
    return null;
  }
  const apiKey = input.ocpApiKey?.trim() ?? "";
  if (apiKey.length === 0) {
    return createPlatformError(
      "validation_failed",
      "OCP API key is required when saveOcpApiKey is opted in",
    );
  }
  return null;
}
