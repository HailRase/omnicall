import { describe, expect, it } from "vitest";
import { createDefaultUserSettings, createSettingsAccountKey } from "@domain/index.js";
import { InMemorySettingsRepository } from "./InMemorySettingsRepository.js";

describe("InMemorySettingsRepository", () => {
  it("persists multi-call settings via setMultiCallSettings", async () => {
    const repository = new InMemorySettingsRepository({
      multiCallSettings: {
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: true,
      },
    });

    await repository.setMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: false,
    });

    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: false,
    });
  });

  it("normalizes autoUnholdOnTransferFailure when omitted", async () => {
    const repository = new InMemorySettingsRepository();

    await repository.setMultiCallSettings({
      multiSessionsEnabled: false,
    });

    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
  });

  it("stores per-account user settings aggregate", async () => {
    const repository = new InMemorySettingsRepository();
    const accountKey = createSettingsAccountKey("agent-42");
    const settings = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 7,
    };

    await repository.saveUserSettings(accountKey, settings);
    expect(await repository.getUserSettings(accountKey)).toEqual(settings);
  });

  it("exposes auto-answer timeout from user settings aggregate", async () => {
    const repository = new InMemorySettingsRepository();
    const accountKey = createSettingsAccountKey("__anonymous__");
    await repository.saveUserSettings(accountKey, {
      ...createDefaultUserSettings(),
      autoAnswerTimeoutSec: 12,
    });

    const incoming = await repository.getIncomingCallSettings();
    expect(incoming.autoAnswerTimeoutSec).toBe(12);
  });
});
