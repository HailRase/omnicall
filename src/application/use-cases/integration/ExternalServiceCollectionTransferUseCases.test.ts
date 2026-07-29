/**
 * - Purpose: verify collection export/import Use Cases and mock file gateway outcomes.
 * - Inputs: in-memory settings, deterministic UUIDs, and configured dialog results.
 * - Outputs: pass/fail coverage for round-trip, collision, cancel, and fail-closed paths.
 */

import { describe, expect, it } from "vitest";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockExternalServicesCollectionFileGateway } from "@adapters/mock/MockExternalServicesCollectionFileGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import {
  createDefaultUserSettings,
  EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
  parseExternalServiceCollectionJson,
  type ExternalServiceCollectionId,
} from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr, isOk } from "@shared/result/index.js";
import {
  createExternalServicesProfileKey,
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_COLLECTION_ID,
} from "../../services/integration/external-services/externalServicesTestFixtures.js";
import { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";
import { ExportExternalServiceCollectionUseCase } from "./ExportExternalServiceCollectionUseCase.js";
import { ImportExternalServiceCollectionUseCase } from "./ImportExternalServiceCollectionUseCase.js";

describe("External Service collection transfer Use Cases", () => {
  const profileKey = createExternalServicesProfileKey("collection-transfer-profile");

  it("exports a collection and imports it with regenerated IDs into the active profile", async () => {
    const settings = {
      ...createDefaultUserSettings(),
      externalServices: createExternalServicesTestSettings(),
    };
    const repository = new InMemorySettingsRepository({
      activeProfileKey: profileKey,
      userSettingsByAccount: new Map([[profileKey, settings]]),
    });
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileKey, settings.externalServices, 1);
    const logger = createTestLogger({
      featureId: "F-031",
      boundedContext: "Integration",
    });
    const clock = new MockClock(new Date("2026-07-29T15:00:00.000Z"));
    const exportUseCase = new ExportExternalServiceCollectionUseCase({
      settingsRepository: repository,
      registry,
      logger,
      clock,
    });
    const importUseCase = new ImportExternalServiceCollectionUseCase({
      settingsRepository: repository,
      registry,
      uuidGenerator: new DeterministicUuidGenerator(),
      logger,
    });

    const exported = await exportUseCase.execute({
      collectionId: EXTERNAL_SERVICES_TEST_COLLECTION_ID as ExternalServiceCollectionId,
    });
    expect(isOk(exported)).toBe(true);
    if (!isOk(exported)) {
      return;
    }
    expect(exported.value.suggestedFileName).toBe(
      "omnicall-external-service-crm.json",
    );
    const parsedExport = parseExternalServiceCollectionJson(
      exported.value.jsonContents,
    );
    expect(parsedExport.ok).toBe(true);
    if (parsedExport.ok) {
      expect(parsedExport.value.format).toBe(EXTERNAL_SERVICE_COLLECTION_FORMAT_ID);
      expect(parsedExport.value.collection.id).toBe(EXTERNAL_SERVICES_TEST_COLLECTION_ID);
    }

    const imported = await importUseCase.execute({
      jsonContents: exported.value.jsonContents,
    });
    expect(isOk(imported)).toBe(true);
    if (!isOk(imported)) {
      return;
    }
    expect(imported.value.profileKey).toBe(profileKey);
    expect(imported.value.collection.id).not.toBe(EXTERNAL_SERVICES_TEST_COLLECTION_ID);
    expect(imported.value.collection.name).toBe("CRM (copy)");
    expect(imported.value.settings.externalServices.collections).toHaveLength(2);
    expect(registry.getSnapshot().settings.collections).toHaveLength(2);
    expect(registry.getSnapshot().settingsRevision).toBe(2);
  });

  it("rejects unknown versions without mutating settings or runtime", async () => {
    const settings = {
      ...createDefaultUserSettings(),
      externalServices: createExternalServicesTestSettings(),
    };
    const repository = new InMemorySettingsRepository({
      activeProfileKey: profileKey,
      userSettingsByAccount: new Map([[profileKey, settings]]),
    });
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileKey, settings.externalServices, 4);
    const importUseCase = new ImportExternalServiceCollectionUseCase({
      settingsRepository: repository,
      registry,
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({
        featureId: "F-031",
        boundedContext: "Integration",
      }),
    });

    const result = await importUseCase.execute({
      jsonContents: JSON.stringify({
        format: EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
        formatVersion: 2,
        exportedAt: "2026-07-29T12:00:00.000Z",
        collection: settings.externalServices.collections[0],
      }),
    });

    expect(isErr(result)).toBe(true);
    const saved = await repository.getUserSettings(profileKey);
    expect(saved.externalServices.collections).toHaveLength(1);
    expect(registry.getSnapshot().settingsRevision).toBe(4);
  });

  it("fails import when the runtime profile is inactive", async () => {
    const repository = new InMemorySettingsRepository({
      activeProfileKey: profileKey,
      userSettingsByAccount: new Map([[profileKey, createDefaultUserSettings()]]),
    });
    const registry = new ExternalServicesRuntimeRegistry();
    const importUseCase = new ImportExternalServiceCollectionUseCase({
      settingsRepository: repository,
      registry,
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({
        featureId: "F-031",
        boundedContext: "Integration",
      }),
    });

    const result = await importUseCase.execute({
      jsonContents: "{}",
    });
    expect(isErr(result)).toBe(true);
  });

  it("maps mock file gateway cancel and file errors without throwing", async () => {
    const cancelled = new MockExternalServicesCollectionFileGateway({
      importResult: { kind: "cancelled" },
      exportResult: { kind: "cancelled" },
    });
    await expect(cancelled.openImportDialog()).resolves.toEqual({ kind: "cancelled" });
    await expect(
      cancelled.saveExportDialog({
        contents: "{}",
        suggestedFileName: "x.json",
      }),
    ).resolves.toEqual({ kind: "cancelled" });

    const failed = new MockExternalServicesCollectionFileGateway({
      importResult: { kind: "error", reason: "file_too_large" },
      exportResult: { kind: "error", reason: "write_failed" },
    });
    await expect(failed.openImportDialog()).resolves.toEqual({
      kind: "error",
      reason: "file_too_large",
    });
    await expect(
      failed.saveExportDialog({
        contents: "{}",
        suggestedFileName: "x.json",
      }),
    ).resolves.toEqual({ kind: "error", reason: "write_failed" });
  });
});
