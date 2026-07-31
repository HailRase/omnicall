/**
 * - Purpose: prove F-030 import refreshes F-031 runtime without restart.
 * - Inputs: mock preferences gateway, External Services composition, dual profiles.
 * - Outputs: runtime registry refresh and fail-closed non-mutation assertions.
 */

import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  createDefaultUserSettings,
  createSettingsAccountKey,
  EXTERNAL_SERVICES_DEFAULTS,
} from "@domain/index.js";
import { DeterministicUuidGenerator } from "@adapters/mock/DeterministicUuidGenerator.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockClock } from "@adapters/mock/MockClock.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import { MockPreferencesFileGateway } from "@adapters/mock/MockPreferencesFileGateway.js";
import { MockMediaGateway } from "@adapters/mock/MockMediaGateway.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createExternalServicesComposition } from "../services/integration/external-services/ExternalServicesComposition.js";
import {
  createExternalServicesTestSettings,
} from "../services/integration/external-services/externalServicesTestFixtures.js";
import { ExportOperatorPreferencesUseCase } from "../use-cases/settings/ExportOperatorPreferencesUseCase.js";

const profileA = createSettingsAccountKey("prefs-a@example.test");
const profileB = createSettingsAccountKey("prefs-b@example.test");

describe("Operator preferences External Services integration", () => {
  it("refreshes F-031 runtime registry after successful F-030 import", async () => {
    const importedSettings = createExternalServicesTestSettings({
      url: "https://imported.example.test/hook",
    });
    const sourceRepository = new InMemorySettingsRepository({
      activeProfileKey: profileA,
      userSettingsByAccount: new Map([
        [
          profileA,
          {
            ...createDefaultUserSettings(),
            theme: "dark",
            externalServices: importedSettings,
          },
        ],
      ]),
    });
    const exportUseCase = new ExportOperatorPreferencesUseCase(
      sourceRepository,
      createTestLogger(),
    );
    const exported = await exportUseCase.execute({ appVersion: "0.13.0" });
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }

    const targetRepository = new InMemorySettingsRepository({
      activeProfileKey: profileB,
      userSettingsByAccount: new Map([
        [profileB, createDefaultUserSettings()],
      ]),
    });
    const composition = createExternalServicesComposition({
      outboundHttp: new MockOutboundHttpAdapter(),
      journalRepository: new InMemoryExternalServicesJournalRepository(),
      clock: new MockClock(new Date("2026-07-29T12:00:00.000Z")),
      uuidGenerator: new DeterministicUuidGenerator(),
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
      settingsRepository: targetRepository,
    });
    composition.activateProfile(profileB, EXTERNAL_SERVICES_DEFAULTS);
    const beforeRevision = composition.registry.getSnapshot().settingsRevision;

    const preferencesFileGateway = new MockPreferencesFileGateway({
      importContents: exported.value.jsonContents,
    });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: targetRepository,
      logger: createTestLogger(),
      preferencesFileGateway,
      externalServicesComposition: composition,
    });

    const imported = await facade.importOperatorPreferences();
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    expect(imported.value.kind).toBe("imported");
    if (imported.value.kind !== "imported") {
      return;
    }

    const saved = await targetRepository.getUserSettings(profileB);
    expect(saved.externalServices).toEqual(importedSettings);
    expect(saved.theme).toBe("dark");

    const runtime = composition.registry.getSnapshot();
    expect(runtime.profileKey).toBe(profileB);
    expect(runtime.settings).toEqual(importedSettings);
    expect(runtime.settingsRevision).toBe(beforeRevision + 1);
  });

  it("leaves F-031 runtime unchanged when preferences import fails", async () => {
    const existingSettings = createExternalServicesTestSettings({
      url: "https://existing.example.test/hook",
    });
    const repository = new InMemorySettingsRepository({
      activeProfileKey: profileA,
      userSettingsByAccount: new Map([
        [
          profileA,
          {
            ...createDefaultUserSettings(),
            externalServices: existingSettings,
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
    composition.activateProfile(profileA, existingSettings);
    const before = composition.registry.getSnapshot();

    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: repository,
      logger: createTestLogger(),
      preferencesFileGateway: new MockPreferencesFileGateway({
        importContents: JSON.stringify({ format: "not-omnicall" }),
      }),
      externalServicesComposition: composition,
    });

    const imported = await facade.importOperatorPreferences();
    expect(imported.ok).toBe(false);

    const saved = await repository.getUserSettings(profileA);
    expect(saved.externalServices).toEqual(existingSettings);
    expect(composition.registry.getSnapshot()).toEqual(before);
  });
});
