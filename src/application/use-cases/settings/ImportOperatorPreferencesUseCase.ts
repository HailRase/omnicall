import {
  parsePreferencesExportJson,
  type UserSettings,
} from "@domain/index.js";
import type { Logger, SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type ImportOperatorPreferencesInput = Readonly<{
  jsonContents: string;
  correlationId?: CorrelationId;
}>;

export type ImportOperatorPreferencesResult = Readonly<{
  settings: UserSettings;
  sourceProfileKey: string | null;
  sourceAppVersion: string | null;
}>;

/**
 * - Purpose: import portable preferences into the active account profile.
 * - Inputs: UTF-8 preferences JSON and optional correlation id.
 * - Outputs: migrated portable UserSettings persisted for the active key.
 */
export class ImportOperatorPreferencesUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ImportOperatorPreferencesInput,
  ): Promise<Result<ImportOperatorPreferencesResult, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const parsed = parsePreferencesExportJson(input.jsonContents);
    if (!parsed.ok) {
      this.logger.error("operator_preferences_import_rejected", {
        correlationId,
        featureId: "F-030",
        boundedContext: "Settings",
        operation: "import_operator_preferences",
        result: parsed.error.code,
      });
      return err(
        createPlatformError("validation_failed", "Invalid preferences export document", [
          parsed.error.message,
        ]),
      );
    }

    const profileKey = await this.settingsRepository.getActiveProfileKey();
    await this.settingsRepository.saveUserSettings(profileKey, parsed.value.settings);

    this.logger.info("operator_preferences_import_completed", {
      correlationId,
      featureId: "F-030",
      boundedContext: "Settings",
      operation: "import_operator_preferences",
      profileKey: profileKey ?? undefined,
      sourceProfileKey: parsed.value.profileKey ?? undefined,
      schemaVersion: parsed.value.settings.schemaVersion,
      result: "succeeded",
    });

    return ok({
      settings: parsed.value.settings,
      sourceProfileKey: parsed.value.profileKey,
      sourceAppVersion: parsed.value.appVersion,
    });
  }
}
