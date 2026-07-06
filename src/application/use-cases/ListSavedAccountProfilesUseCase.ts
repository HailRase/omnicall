import type { SavedAccountProfile } from "@domain/index.js";
import type { SavedAccountProfileRepository } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type ListSavedAccountProfilesInput = Readonly<{
  correlationId?: CorrelationId;
}>;

export class ListSavedAccountProfilesUseCase {
  constructor(
    private readonly savedAccountProfileRepository: SavedAccountProfileRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ListSavedAccountProfilesInput = {},
  ): Promise<Result<ReadonlyArray<SavedAccountProfile>, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const profiles = await this.savedAccountProfileRepository.listProfiles();

    this.logger.info("saved_account_profiles_listed", {
      correlationId,
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "list_saved_account_profiles",
      result: "succeeded",
      count: profiles.length,
    });

    return ok(profiles);
  }
}
