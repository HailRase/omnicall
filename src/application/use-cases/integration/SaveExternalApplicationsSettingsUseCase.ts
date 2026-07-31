/**
 * - Purpose: persist only the External Applications settings slice for the active profile.
 * - Inputs: validated ExternalApplicationsSettings and optional settings revision expectation.
 * - Outputs: saved settings with refreshed runtime revision, or structured errors.
 */

import {
  parseExternalApplicationsSettings,
  validateUserSettings,
  type ExternalApplicationsSettings,
  type SettingsAccountKey,
  type UserSettings,
} from "@domain/index.js";
import type { Logger, SettingsRepository } from "@ports/index.js";
import { createPlatformError, type PlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";
import type { ExternalApplicationsRuntimeRegistry } from "../../services/integration/external-applications/ExternalApplicationsRuntimeRegistry.js";

export type SaveExternalApplicationsSettingsInput = Readonly<{
  profileKey: SettingsAccountKey;
  externalApplications: ExternalApplicationsSettings;
  expectedSettingsRevision?: number;
}>;

export type SaveExternalApplicationsSettingsOutcome = Readonly<{
  settings: UserSettings;
  settingsRevision: number;
}>;

export type SaveExternalApplicationsSettingsUseCaseDeps = Readonly<{
  settingsRepository: SettingsRepository;
  registry: ExternalApplicationsRuntimeRegistry;
  logger: Logger;
}>;

export class SaveExternalApplicationsSettingsUseCase {
  constructor(private readonly deps: SaveExternalApplicationsSettingsUseCaseDeps) {}

  async execute(
    input: SaveExternalApplicationsSettingsInput,
  ): Promise<Result<SaveExternalApplicationsSettingsOutcome, PlatformError>> {
    const runtime = this.deps.registry.getSnapshot();
    if (runtime.profileKey === null || runtime.profileKey !== input.profileKey) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Applications save requires the active profile.",
          { reason: "profile_inactive" },
        ),
      );
    }
    if (
      input.expectedSettingsRevision !== undefined &&
      input.expectedSettingsRevision !== runtime.settingsRevision
    ) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Applications settings revision is stale.",
          { reason: "settings_revision_mismatch" },
        ),
      );
    }

    const parsed = parseExternalApplicationsSettings(input.externalApplications);
    if (!parsed.ok) {
      return err(
        createPlatformError(
          "validation_failed",
          "External Applications settings are invalid.",
          { reason: "external_applications_invalid" },
        ),
      );
    }

    try {
      const current = await this.deps.settingsRepository.getUserSettings(
        input.profileKey,
      );
      const nextCandidate: UserSettings = {
        ...current,
        externalApplications: parsed.value,
      };
      const validated = validateUserSettings(nextCandidate);
      if (!validated.ok) {
        return err(
          createPlatformError(
            "validation_failed",
            "User settings validation failed.",
            { reason: "settings_validation_failed" },
          ),
        );
      }
      await this.deps.settingsRepository.saveUserSettings(
        input.profileKey,
        validated.value,
      );
      this.deps.registry.replaceSettings(validated.value.externalApplications);
      return ok({
        settings: validated.value,
        settingsRevision: this.deps.registry.getSnapshot().settingsRevision,
      });
    } catch (error: unknown) {
      this.deps.logger.error(
        "external_applications_settings_save_failed",
        {
          featureId: "F-032",
          boundedContext: "Integration",
          operation: "save_external_applications_settings",
          result: "failed",
        },
        error,
      );
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to persist External Applications settings.",
          { reason: "external_applications_persist_failed" },
        ),
      );
    }
  }
}
