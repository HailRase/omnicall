import {
  createSavedAccountProfile,
  type SavedAccountProfile,
  type SavedAccountProfileInput,
} from "@domain/index.js";
import type { SavedAccountProfileRepository } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type SaveAccountProfileInput = Readonly<{
  profile: SavedAccountProfileInput;
  correlationId?: CorrelationId;
}>;

export class SaveAccountProfileUseCase {
  constructor(
    private readonly savedAccountProfileRepository: SavedAccountProfileRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: SaveAccountProfileInput,
  ): Promise<Result<SavedAccountProfile, PlatformError>> {
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

    const saved = await this.savedAccountProfileRepository.saveProfile(input.profile);

    this.logger.info("saved_account_profile_saved", {
      correlationId,
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "save_account_profile",
      result: "succeeded",
      profileId: saved.id,
    });

    return ok(saved);
  }
}
