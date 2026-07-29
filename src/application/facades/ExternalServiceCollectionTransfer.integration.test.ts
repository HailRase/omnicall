/**
 * - Purpose: prove facade collection import/export refreshes F-031 runtime and respects cancel.
 * - Inputs: mock collection file gateway, composition, active profile fixtures.
 * - Outputs: regenerated-ID import, cancel non-error, and fail-closed assertions.
 */

import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  buildExternalServiceCollectionDocument,
  createDefaultUserSettings,
  createSettingsAccountKey,
  serializeExternalServiceCollectionDocument,
  type ExternalServiceCollectionId,
} from "@domain/index.js";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockExternalServicesCollectionFileGateway } from "@adapters/mock/MockExternalServicesCollectionFileGateway.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import { MockMediaGateway } from "@adapters/mock/MockMediaGateway.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isOk } from "@shared/result/index.js";
import { createExternalServicesComposition } from "../services/integration/external-services/ExternalServicesComposition.js";
import {
  createExternalServicesTestSettings,
  EXTERNAL_SERVICES_TEST_COLLECTION_ID,
} from "../services/integration/external-services/externalServicesTestFixtures.js";

const profileKey = createSettingsAccountKey("collection-transfer@example.test");

describe("External Services collection transfer facade", () => {
  it("imports a collection into the active profile with regenerated IDs", async () => {
    const existing = createExternalServicesTestSettings();
    const exportJson = serializeExternalServiceCollectionDocument(
      buildExternalServiceCollectionDocument({
        collection: existing.collections[0]!,
        exportedAt: "2026-07-29T12:00:00.000Z",
      }),
    );
    const repository = new InMemorySettingsRepository({
      activeProfileKey: profileKey,
      userSettingsByAccount: new Map([
        [
          profileKey,
          {
            ...createDefaultUserSettings(),
            externalServices: existing,
          },
        ],
      ]),
    });
    const composition = createExternalServicesComposition({
      outboundHttp: new MockOutboundHttpAdapter(),
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
      settingsRepository: repository,
    });
    composition.activateProfile(profileKey, existing, 1);

    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway(),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: repository,
      externalServicesComposition: composition,
      externalServicesCollectionFileGateway: new MockExternalServicesCollectionFileGateway({
        importContents: exportJson,
      }),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });

    const result = await facade.importExternalServiceCollection();
    expect(isOk(result)).toBe(true);
    if (!isOk(result) || result.value.kind !== "imported") {
      return;
    }
    expect(result.value.collection.id).not.toBe(EXTERNAL_SERVICES_TEST_COLLECTION_ID);
    expect(result.value.collection.name).toBe("CRM (copy)");
    expect(composition.registry.getSnapshot().settings.collections).toHaveLength(2);
  });

  it("treats cancelled export dialog as a non-error outcome", async () => {
    const settings = createExternalServicesTestSettings();
    const repository = new InMemorySettingsRepository({
      activeProfileKey: profileKey,
      userSettingsByAccount: new Map([
        [profileKey, { ...createDefaultUserSettings(), externalServices: settings }],
      ]),
    });
    const composition = createExternalServicesComposition({
      outboundHttp: new MockOutboundHttpAdapter(),
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
      settingsRepository: repository,
    });
    composition.activateProfile(profileKey, settings, 1);

    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway(),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: repository,
      externalServicesComposition: composition,
      externalServicesCollectionFileGateway: new MockExternalServicesCollectionFileGateway({
        exportResult: { kind: "cancelled" },
      }),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
    });

    const result = await facade.exportExternalServiceCollection(
      EXTERNAL_SERVICES_TEST_COLLECTION_ID as ExternalServiceCollectionId,
    );
    expect(result).toEqual({ ok: true, value: { kind: "cancelled" } });
  });
});
