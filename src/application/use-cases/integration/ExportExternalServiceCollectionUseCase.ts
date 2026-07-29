/**
 * - Purpose: prepare a portable single-collection JSON export for the active profile.
 * - Inputs: collection id and optional correlation id / export timestamp.
 * - Outputs: UTF-8 JSON contents and suggested filename, or structured errors.
 */

import {
  buildExternalServiceCollectionDocument,
  buildExternalServiceCollectionSuggestedFileName,
  serializeExternalServiceCollectionDocument,
  type ExternalServiceCollectionId,
  type SettingsAccountKey,
} from "@domain/index.js";
import type { Clock, Logger, SettingsRepository } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  createPlatformError,
  normalizeUnknownError,
  type PlatformError,
} from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";
import type { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";

export type ExportExternalServiceCollectionInput = Readonly<{
  collectionId: ExternalServiceCollectionId;
  correlationId?: CorrelationId;
  exportedAt?: string;
}>;

export type ExportExternalServiceCollectionOutcome = Readonly<{
  jsonContents: string;
  suggestedFileName: string;
  collectionId: ExternalServiceCollectionId;
  collectionName: string;
  profileKey: SettingsAccountKey;
}>;

export type ExportExternalServiceCollectionUseCaseDeps = Readonly<{
  settingsRepository: SettingsRepository;
  registry: ExternalServicesRuntimeRegistry;
  logger: Logger;
  clock?: Clock;
}>;

export class ExportExternalServiceCollectionUseCase {
  constructor(private readonly deps: ExportExternalServiceCollectionUseCaseDeps) {}

  async execute(
    input: ExportExternalServiceCollectionInput,
  ): Promise<Result<ExportExternalServiceCollectionOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const runtime = this.deps.registry.getSnapshot();
    if (runtime.profileKey === null) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services export requires the active profile.",
          { reason: "profile_inactive" },
        ),
      );
    }

    try {
      const settings = await this.deps.settingsRepository.getUserSettings(
        runtime.profileKey,
      );
      const collection = settings.externalServices.collections.find(
        (entry) => entry.id === input.collectionId,
      );
      if (collection === undefined) {
        return err(
          createPlatformError(
            "validation_failed",
            "External Services collection was not found.",
            { reason: "collection_not_found" },
          ),
        );
      }

      const exportedAt =
        input.exportedAt ??
        this.deps.clock?.now().toISOString() ??
        new Date().toISOString();
      const document = buildExternalServiceCollectionDocument({
        collection,
        exportedAt,
      });
      const jsonContents = serializeExternalServiceCollectionDocument(document);
      const suggestedFileName = buildExternalServiceCollectionSuggestedFileName(
        collection.name,
      );

      this.deps.logger.info("external_service_collection_export_prepared", {
        correlationId,
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "export_external_service_collection",
        profileKey: runtime.profileKey,
        result: "succeeded",
      });

      return ok({
        jsonContents,
        suggestedFileName,
        collectionId: collection.id,
        collectionName: collection.name,
        profileKey: runtime.profileKey,
      });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.deps.logger.error("external_service_collection_export_failed", {
        correlationId,
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "export_external_service_collection",
        result: normalized.code,
      });
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to export External Services collection.",
          [normalized.code],
        ),
      );
    }
  }
}
