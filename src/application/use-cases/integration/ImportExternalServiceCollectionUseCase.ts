/**
 * - Purpose: import one portable collection into the active profile settings.
 * - Inputs: UTF-8 collection JSON and optional correlation id.
 * - Outputs: regenerated collection appended to active settings with runtime refresh.
 */

import {
  parseExternalServiceCollectionJson,
  regenerateExternalServiceCollectionIds,
  resolveImportedExternalServiceCollectionName,
  validateUserSettings,
  type ExternalServiceCollection,
  type SettingsAccountKey,
  type UserSettings,
} from "@domain/index.js";
import type { Logger, SettingsRepository, UuidGenerator } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  createPlatformError,
  type PlatformError,
} from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";
import type { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";

export type ImportExternalServiceCollectionInput = Readonly<{
  jsonContents: string;
  correlationId?: CorrelationId;
}>;

export type ImportExternalServiceCollectionOutcome = Readonly<{
  collection: ExternalServiceCollection;
  settings: UserSettings;
  settingsRevision: number;
  profileKey: SettingsAccountKey;
}>;

export type ImportExternalServiceCollectionUseCaseDeps = Readonly<{
  settingsRepository: SettingsRepository;
  registry: ExternalServicesRuntimeRegistry;
  uuidGenerator: UuidGenerator;
  logger: Logger;
}>;

export class ImportExternalServiceCollectionUseCase {
  constructor(private readonly deps: ImportExternalServiceCollectionUseCaseDeps) {}

  async execute(
    input: ImportExternalServiceCollectionInput,
  ): Promise<Result<ImportExternalServiceCollectionOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const runtime = this.deps.registry.getSnapshot();
    if (runtime.profileKey === null) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services import requires the active profile.",
          { reason: "profile_inactive" },
        ),
      );
    }

    const parsed = parseExternalServiceCollectionJson(input.jsonContents);
    if (!parsed.ok) {
      this.deps.logger.error("external_service_collection_import_rejected", {
        correlationId,
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "import_external_service_collection",
        result: parsed.error.code,
      });
      return err(
        createPlatformError(
          "validation_failed",
          "Invalid External Services collection document.",
          [parsed.error.message],
        ),
      );
    }

    try {
      const current = await this.deps.settingsRepository.getUserSettings(
        runtime.profileKey,
      );
      const existingNames = new Set(
        current.externalServices.collections.map((entry) => entry.name),
      );
      const regenerated = regenerateExternalServiceCollectionIds(
        parsed.value.collection,
        this.deps.uuidGenerator,
      );
      const importedCollection: ExternalServiceCollection = Object.freeze({
        ...regenerated,
        name: resolveImportedExternalServiceCollectionName(
          regenerated.name,
          existingNames,
        ),
      });

      const nextCandidate: UserSettings = {
        ...current,
        externalServices: {
          collections: [
            ...current.externalServices.collections,
            importedCollection,
          ],
        },
      };
      const validated = validateUserSettings(nextCandidate);
      if (!validated.ok) {
        return err(
          createPlatformError(
            "validation_failed",
            "User settings validation failed after collection import.",
            { reason: "settings_validation_failed" },
          ),
        );
      }

      await this.deps.settingsRepository.saveUserSettings(
        runtime.profileKey,
        validated.value,
      );
      this.deps.registry.replaceSettings(validated.value.externalServices);

      this.deps.logger.info("external_service_collection_import_completed", {
        correlationId,
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "import_external_service_collection",
        profileKey: runtime.profileKey,
        result: "succeeded",
      });

      return ok({
        collection: importedCollection,
        settings: validated.value,
        settingsRevision: this.deps.registry.getSnapshot().settingsRevision,
        profileKey: runtime.profileKey,
      });
    } catch (error: unknown) {
      this.deps.logger.error(
        "external_service_collection_import_failed",
        {
          correlationId,
          featureId: "F-031",
          boundedContext: "Integration",
          operation: "import_external_service_collection",
          result: "failed",
        },
        error,
      );
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to import External Services collection.",
          { reason: "external_service_collection_import_failed" },
        ),
      );
    }
  }
}
