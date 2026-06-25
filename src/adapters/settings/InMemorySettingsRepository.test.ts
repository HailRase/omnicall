import { describe, expect, it } from "vitest";
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
});
