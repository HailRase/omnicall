/**
 * - Purpose: persist only the External Services settings slice for the active profile.
 * - Inputs: validated ExternalServicesSettings and optional settings revision expectation.
 * - Outputs: saved settings with refreshed runtime revision, or structured validation/persistence errors.
 */

import {
  parseExternalServicesSettings,
  validateUserSettings,
  type ExternalServicesSettings,
  type SettingsAccountKey,
  type UserSettings,
} from "@domain/index.js";
import type { Logger, SettingsRepository } from "@ports/index.js";
import { createPlatformError, type PlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";
import type { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";

export type SaveExternalServicesSettingsInput = Readonly<{
  profileKey: SettingsAccountKey;
  externalServices: ExternalServicesSettings;
  expectedSettingsRevision?: number;
}>;

export type SaveExternalServicesSettingsOutcome = Readonly<{
  settings: UserSettings;
  settingsRevision: number;
}>;

export type SaveExternalServicesSettingsUseCaseDeps = Readonly<{
  settingsRepository: SettingsRepository;
  registry: ExternalServicesRuntimeRegistry;
  logger: Logger;
}>;

export class SaveExternalServicesSettingsUseCase {
  constructor(private readonly deps: SaveExternalServicesSettingsUseCaseDeps) {}

  async execute(
    input: SaveExternalServicesSettingsInput,
  ): Promise<Result<SaveExternalServicesSettingsOutcome, PlatformError>> {
    const runtime = this.deps.registry.getSnapshot();
    if (runtime.profileKey === null || runtime.profileKey !== input.profileKey) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services save requires the active profile.",
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
          "External Services settings revision is stale.",
          { reason: "settings_revision_mismatch" },
        ),
      );
    }

    const parsed = parseExternalServicesSettings(input.externalServices);
    if (!parsed.ok) {
      return err(
        createPlatformError(
          "validation_failed",
          "External Services settings are invalid.",
          { reason: "external_services_invalid" },
        ),
      );
    }

    try {
      const current = await this.deps.settingsRepository.getUserSettings(
        input.profileKey,
      );
      const nextCandidate: UserSettings = {
        ...current,
        externalServices: parsed.value,
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
      this.deps.registry.replaceSettings(validated.value.externalServices);
      return ok({
        settings: validated.value,
        settingsRevision: this.deps.registry.getSnapshot().settingsRevision,
      });
    } catch (error: unknown) {
      this.deps.logger.error(
        "external_services_settings_save_failed",
        {
          featureId: "F-031",
          boundedContext: "Integration",
          operation: "save_external_services_settings",
          result: "failed",
        },
        error,
      );
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to persist External Services settings.",
          { reason: "external_services_persist_failed" },
        ),
      );
    }
  }
}
