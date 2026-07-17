/**
 * - Purpose: load secret-free availability view for a saved account profile.
 * - Inputs: profile id.
 * - Outputs: availability booleans only (never secret strings).
 */

import type { SavedAccountProfileId } from "@domain/index.js";
import type { Logger, SavedAccountProfileRepository } from "@ports/index.js";
import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
  type SecretStoragePort,
} from "@ports/secrets/SecretStoragePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import {
  deriveSavedAccountProfileAvailability,
  type SavedAccountProfileAvailabilityView,
} from "../../projections/settings/deriveSavedAccountProfileAvailability.js";
import { LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE } from "../../projections/settings/isLocalSavedProfileNotFoundError.js";

export type ResolveSavedAccountProfileAvailabilityInput = Readonly<{
  profileId: SavedAccountProfileId;
  correlationId?: CorrelationId;
}>;

export class ResolveSavedAccountProfileAvailabilityUseCase {
  constructor(
    private readonly savedAccountProfileRepository: SavedAccountProfileRepository,
    private readonly secretStoragePort: SecretStoragePort,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ResolveSavedAccountProfileAvailabilityInput,
  ): Promise<Result<SavedAccountProfileAvailabilityView, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const profile = await this.savedAccountProfileRepository.getProfileById(input.profileId);
    if (profile === null) {
      return err(
        createPlatformError("not_found", LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE),
      );
    }

    const scopeKey = createSecretStorageScopeKey(input.profileId);
    const hasSavedSipPassword = await this.hasSecret(scopeKey, SIP_PASSWORD_SECRET_ID);
    const hasSavedOcpApiKey = await this.hasSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID);

    const view = deriveSavedAccountProfileAvailability({
      profile,
      hasSavedSipPassword,
      hasSavedOcpApiKey,
    });

    this.logger.info("saved_account_profile_availability_resolved", {
      correlationId,
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "resolve_saved_account_profile_availability",
      result: "succeeded",
      profileId: input.profileId,
      hasSavedSipPassword: view.hasSavedSipPassword,
      hasSavedOcpApiKey: view.hasSavedOcpApiKey,
      hasCompleteOcpConfiguration: view.hasCompleteOcpConfiguration,
      isDraft: view.isDraft,
    });

    return ok(view);
  }

  private async hasSecret(
    scopeKey: ReturnType<typeof createSecretStorageScopeKey>,
    secretId: string,
  ): Promise<boolean> {
    try {
      const value = await this.secretStoragePort.loadSecret(scopeKey, secretId);
      return value !== null && value.length > 0;
    } catch {
      return false;
    }
  }
}
