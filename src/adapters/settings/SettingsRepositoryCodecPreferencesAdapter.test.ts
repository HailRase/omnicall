import { describe, expect, it } from "vitest";
import {
  createDefaultCodecPreferences,
  createDefaultUserSettings,
  createSettingsAccountKey,
  reorderAudioCodecs,
} from "@domain/index.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { SettingsRepositoryCodecPreferencesAdapter } from "./SettingsRepositoryCodecPreferencesAdapter.js";

describe("SettingsRepositoryCodecPreferencesAdapter", () => {
  it("returns codec preferences for current account settings", async () => {
    const accountKey = createSettingsAccountKey("agent-codec");
    const reordered = reorderAudioCodecs(createDefaultCodecPreferences(), 0, 1);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) {
      throw new Error("expected reorder to succeed");
    }

    const settingsRepository = new InMemorySettingsRepository({
      userSettingsByAccount: new Map([
        [
          accountKey,
          {
            ...createDefaultUserSettings(),
            codecPreferences: reordered.value,
          },
        ],
      ]),
    });

    const adapter = new SettingsRepositoryCodecPreferencesAdapter({
      settingsRepository,
      resolveAccountKey: () => Promise.resolve(accountKey),
    });

    const preferences = await adapter.getCodecPreferences();
    expect(preferences).toEqual(reordered.value);
  });

  it("reflects saved user settings updates", async () => {
    const accountKey = createSettingsAccountKey("agent-codec-live");
    const settingsRepository = new InMemorySettingsRepository({
      userSettingsByAccount: new Map([
        [accountKey, createDefaultUserSettings()],
      ]),
    });

    const adapter = new SettingsRepositoryCodecPreferencesAdapter({
      settingsRepository,
      resolveAccountKey: () => Promise.resolve(accountKey),
    });

    const toggled = createDefaultCodecPreferences();
    const nextSettings = {
      ...createDefaultUserSettings(),
      codecPreferences: {
        ...toggled,
        audio: toggled.audio.map((entry) =>
          entry.id === "opus" ? { ...entry, enabled: false } : entry,
        ),
      },
    };
    await settingsRepository.saveUserSettings(accountKey, nextSettings);

    const preferences = await adapter.getCodecPreferences();
    expect(preferences.audio.find((entry) => entry.id === "opus")?.enabled).toBe(false);
  });
});
