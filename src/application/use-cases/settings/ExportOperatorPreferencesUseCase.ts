import {
  buildPreferencesExportDocument,
  serializePreferencesExportDocument,
  type SettingsAccountKey,
  type UserSettings,
} from "@domain/index.js";
import type { Logger, SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type ExportOperatorPreferencesInput = Readonly<{
  correlationId?: CorrelationId;
  appVersion?: string | null;
}>;

export type ExportOperatorPreferencesResult = Readonly<{
  jsonContents: string;
  profileKey: SettingsAccountKey;
  settings: UserSettings;
}>;

/**
 * - Purpose: build a portable preferences JSON for the active account profile.
 * - Inputs: optional app version and correlation id.
 * - Outputs: UTF-8 JSON without secrets or machine device ids.
 */
export class ExportOperatorPreferencesUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ExportOperatorPreferencesInput = {},
  ): Promise<Result<ExportOperatorPreferencesResult, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    try {
      const profileKey = await this.settingsRepository.getActiveProfileKey();
      const settings = await this.settingsRepository.getUserSettings(profileKey);
      const document = buildPreferencesExportDocument({
        settings,
        profileKey,
        appVersion: input.appVersion ?? null,
      });
      const jsonContents = serializePreferencesExportDocument(document);

      this.logger.info("operator_preferences_export_prepared", {
        correlationId,
        featureId: "F-030",
        boundedContext: "Settings",
        operation: "export_operator_preferences",
        profileKey,
        schemaVersion: document.settings.schemaVersion,
        result: "succeeded",
      });

      return ok({
        jsonContents,
        profileKey,
        settings: document.settings,
      });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error("operator_preferences_export_failed", {
        correlationId,
        featureId: "F-030",
        boundedContext: "Settings",
        operation: "export_operator_preferences",
        result: normalized.code,
      });
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to export operator preferences",
          [normalized.code],
        ),
      );
    }
  }
}
