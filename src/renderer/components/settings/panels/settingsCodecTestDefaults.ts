import { createDefaultUserSettings } from "@application/index.js";

export const settingsCodecTestDefaults = {
  codecPreferences: createDefaultUserSettings().codecPreferences,
  onAudioCodecEnabledChange: (): void => undefined,
  onVideoCodecEnabledChange: (): void => undefined,
  onAudioCodecReorder: (): void => undefined,
  onVideoCodecReorder: (): void => undefined,
  codecPreferencesError: null,
} as const;
