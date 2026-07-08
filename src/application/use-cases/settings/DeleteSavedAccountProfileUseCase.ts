import type { SavedAccountProfileId } from "@domain/index.js";
import type { SavedAccountProfileRepository } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type DeleteSavedAccountProfileInput = Readonly<{
  profileId: SavedAccountProfileId;
  correlationId?: CorrelationId;
}>;

export class DeleteSavedAccountProfileUseCase {
  constructor(
    private readonly savedAccountProfileRepository: SavedAccountProfileRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: DeleteSavedAccountProfileInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const existing = await this.savedAccountProfileRepository.getProfileById(input.profileId);
    if (existing === null) {
      return err(
        createPlatformError("not_found", "Saved account profile was not found"),
      );
    }

    await this.savedAccountProfileRepository.deleteProfile(input.profileId);

    this.logger.info("saved_account_profile_deleted", {
      correlationId,
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "delete_saved_account_profile",
      result: "succeeded",
      profileId: input.profileId,
    });

    return ok(undefined);
  }
}
