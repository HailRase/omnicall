/**
 * - Purpose: verify SaveExternalServicesSettingsUseCase refresh and validation rules.
 * - Inputs: in-memory settings repository and runtime registry fixtures.
 * - Outputs: save outcome and revision assertions.
 */

import { describe, expect, it } from "vitest";
import {
  createDefaultUserSettings,
  createSettingsAccountKey,
} from "@domain/index.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";
import {
  createExternalServicesTestSettings,
} from "../../services/integration/external-services/externalServicesTestFixtures.js";
import { SaveExternalServicesSettingsUseCase } from "./SaveExternalServicesSettingsUseCase.js";

describe("SaveExternalServicesSettingsUseCase", () => {
  it("persists the External Services slice and refreshes runtime revision", async () => {
    const profileKey = createSettingsAccountKey("agent-a@example.test");
    const repository = new InMemorySettingsRepository();
    await repository.setActiveProfileKey(profileKey);
    await repository.saveUserSettings(profileKey, createDefaultUserSettings());
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileKey, createDefaultUserSettings().externalServices, 1);
    const useCase = new SaveExternalServicesSettingsUseCase({
      settingsRepository: repository,
      registry,
      logger: createTestLogger(),
    });
    const next = createExternalServicesTestSettings();

    const result = await useCase.execute({
      profileKey,
      externalServices: next,
      expectedSettingsRevision: 1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.settingsRevision).toBe(2);
    expect(result.value.settings.externalServices).toEqual(next);
    expect(registry.getSnapshot().settings).toEqual(next);
    await expect(repository.getUserSettings(profileKey)).resolves.toMatchObject({
      externalServices: next,
    });
  });

  it("rejects stale revisions without mutating persisted settings", async () => {
    const profileKey = createSettingsAccountKey("agent-a@example.test");
    const repository = new InMemorySettingsRepository();
    await repository.setActiveProfileKey(profileKey);
    await repository.saveUserSettings(profileKey, createDefaultUserSettings());
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileKey, createDefaultUserSettings().externalServices, 3);
    const useCase = new SaveExternalServicesSettingsUseCase({
      settingsRepository: repository,
      registry,
      logger: createTestLogger(),
    });

    const result = await useCase.execute({
      profileKey,
      externalServices: createExternalServicesTestSettings(),
      expectedSettingsRevision: 1,
    });

    expect(result.ok).toBe(false);
    await expect(repository.getUserSettings(profileKey)).resolves.toEqual(
      createDefaultUserSettings(),
    );
  });
});
