import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";
import { deriveActiveProfileSettingsSyncKey } from "@application/index.js";
import { deriveRegisteredAccountIdentity } from "@application/projections/deriveRegisteredAccountIdentity.js";
import {
  createDefaultUserSettings,
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
  mapCodecPreferenceMutationError,
  reorderAudioCodecs,
  reorderVideoCodecs,
  setAudioCodecEnabled,
  setVideoCodecEnabled,
  type AppTheme,
  type AudioCodecId,
  type CodecPreferenceMutationMessageKey,
  type SupportedLanguage,
  type UserSettings,
  type VideoCodecId,
} from "@application/index.js";
import { applyAppTheme } from "../theme/applyAppTheme.js";
import { DEFAULT_AUTO_ANSWER_TIMEOUT_SEC } from "../components/settings/panels/SettingsSessionsPanel.js";
import { setRendererLanguage, translateCurrent } from "../i18n/index.js";
import { useAccountActions } from "./useAccountActions.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type UseSettingsActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  currentSettings: MultiCallSettings;
  applyMultiCallSettings: (settings: MultiCallSettings) => void;
  isSipRegistered?: boolean;
}>;

type UseSettingsActionsResult = Readonly<{
  account: ReturnType<typeof useAccountActions>;
  userSettings: UserSettings;
  onLanguageChange: (language: SupportedLanguage) => void;
  onThemeChange: (theme: AppTheme) => void;
  onMultiSessionsToggle: (enabled: boolean) => void;
  onAutoAnswerEnabledToggle: (enabled: boolean) => void;
  onAutoAnswerTimeoutChange: (timeoutSec: number) => void;
  onAutoAnswerDuringActiveSessionToggle: (enabled: boolean) => void;
  onSipAutoReregisterToggle: (enabled: boolean) => void;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
  onSipAutoReconnectToggle: (enabled: boolean) => void;
  onSipReconnectIntervalChange: (intervalSec: number) => void;
  onSipReconnectMaxAttemptsChange: (attempts: number) => void;
  onSipReregisterMaxAttemptsChange: (attempts: number) => void;
  onSipAutoRegisterOnStartupToggle: (enabled: boolean) => void;
  onDismissUpdateBannerVersion: (latestVersion: string) => void;
  onAudioCodecEnabledChange: (codecId: AudioCodecId, enabled: boolean) => void;
  onVideoCodecEnabledChange: (codecId: VideoCodecId, enabled: boolean) => void;
  onAudioCodecReorder: (fromIndex: number, toIndex: number) => void;
  onVideoCodecReorder: (fromIndex: number, toIndex: number) => void;
  codecPreferencesError: CodecPreferenceMutationMessageKey | null;
  settingsUpdateError: string | null;
}>;

function resolveSettingsUpdateError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : translateCurrent("errors.settingsSaveFailed");
}

function syncNativeTheme(theme: AppTheme): void {
  void window.softphone.setNativeTheme({ theme });
}

function applyLoadedUserSettings(
  settings: UserSettings,
  applyMultiCallSettings: (settings: MultiCallSettings) => void,
): void {
  setRendererLanguage(settings.language);
  applyAppTheme(settings.theme);
  syncNativeTheme(settings.theme);
  applyMultiCallSettings({
    multiSessionsEnabled: settings.multiSessionsEnabled,
    autoUnholdOnTransferFailure: settings.autoUnholdOnTransferFailure,
  });
}

/**
 * - Purpose: bind settings overlay toggles to facade user settings (LF-032, LF-076, F-014).
 * - Inputs: facade, current multi-call settings, store projection applier.
 * - Outputs: settings callbacks and observable save errors.
 */
export function useSettingsActions(
  input: UseSettingsActionsInput,
): UseSettingsActionsResult {
  const { facade, currentSettings, applyMultiCallSettings, isSipRegistered = false } = input;
  const projection = useAccountBootstrapStore((state) => state.projection);
  const registeredIdentity = deriveRegisteredAccountIdentity(projection);
  const account = useAccountActions({ facade, isSipRegistered, registeredIdentity });
  const activeProfileSettingsSyncKey = useAccountBootstrapStore((state) =>
    deriveActiveProfileSettingsSyncKey(state.projection),
  );
  const [settingsUpdateError, setSettingsUpdateError] = useState<string | null>(null);
  const [codecPreferencesError, setCodecPreferencesError] =
    useState<CodecPreferenceMutationMessageKey | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(createDefaultUserSettings());

  useEffect(() => {
    if (facade === null || activeProfileSettingsSyncKey === null) {
      return;
    }

    void facade.getUserSettingsForAccount().then((result) => {
      if (result.ok) {
        setUserSettings(result.value);
        applyLoadedUserSettings(result.value, applyMultiCallSettings);
      }
    });
  }, [activeProfileSettingsSyncKey, applyMultiCallSettings, facade]);

  const persistUserSettings = useCallback(
    (next: UserSettings): void => {
      if (facade === null) {
        return;
      }

      void facade
        .saveUserSettings(next)
        .then((result) => {
          if (!result.ok) {
            setSettingsUpdateError(result.error.message);
            return;
          }

          setSettingsUpdateError(null);
          setCodecPreferencesError(null);
          setUserSettings(result.value);
          applyLoadedUserSettings(result.value, applyMultiCallSettings);
        })
        .catch((error: unknown) => {
          setSettingsUpdateError(resolveSettingsUpdateError(error));
        });
    },
    [applyMultiCallSettings, facade],
  );

  const onThemeChange = useCallback(
    (theme: AppTheme): void => {
      applyAppTheme(theme);
      syncNativeTheme(theme);
      persistUserSettings({
        ...userSettings,
        theme,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onLanguageChange = useCallback(
    (language: SupportedLanguage): void => {
      setRendererLanguage(language);
      persistUserSettings({
        ...userSettings,
        language,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onMultiSessionsToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        multiSessionsEnabled: enabled,
        autoUnholdOnTransferFailure:
          currentSettings.autoUnholdOnTransferFailure !== false,
      });
    },
    [currentSettings.autoUnholdOnTransferFailure, persistUserSettings, userSettings],
  );

  const onAutoAnswerEnabledToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        autoAnswerTimeoutSec: enabled
          ? (userSettings.autoAnswerTimeoutSec ?? DEFAULT_AUTO_ANSWER_TIMEOUT_SEC)
          : null,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onAutoAnswerTimeoutChange = useCallback(
    (timeoutSec: number): void => {
      const normalized = Math.min(
        MAX_AUTO_ANSWER_TIMEOUT_SEC,
        Math.max(MIN_AUTO_ANSWER_TIMEOUT_SEC, timeoutSec),
      );
      persistUserSettings({
        ...userSettings,
        autoAnswerTimeoutSec: normalized,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onAutoAnswerDuringActiveSessionToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        autoAnswerDuringActiveSessionEnabled: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipAutoReregisterToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        sipAutoReregisterEnabled: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipReregisterIntervalChange = useCallback(
    (intervalSec: number): void => {
      const normalized = Math.max(MIN_SIP_REREGISTER_INTERVAL_SEC, intervalSec);
      persistUserSettings({
        ...userSettings,
        sipReregisterIntervalSec: normalized,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipAutoReconnectToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        sipAutoReconnectEnabled: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipReconnectIntervalChange = useCallback(
    (intervalSec: number): void => {
      const normalized = Math.max(MIN_SIP_RECONNECT_INTERVAL_SEC, intervalSec);
      persistUserSettings({
        ...userSettings,
        sipReconnectIntervalSec: normalized,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipReconnectMaxAttemptsChange = useCallback(
    (attempts: number): void => {
      const normalized = Math.max(1, attempts);
      persistUserSettings({
        ...userSettings,
        sipReconnectMaxAttempts: normalized,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipReregisterMaxAttemptsChange = useCallback(
    (attempts: number): void => {
      const normalized = Math.max(1, attempts);
      persistUserSettings({
        ...userSettings,
        sipReregisterMaxAttempts: normalized,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipAutoRegisterOnStartupToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        sipAutoRegisterOnStartup: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const applyCodecPreferencesMutation = useCallback(
    (next: UserSettings): void => {
      persistUserSettings(next);
    },
    [persistUserSettings],
  );

  const onAudioCodecEnabledChange = useCallback(
    (codecId: AudioCodecId, enabled: boolean): void => {
      const result = setAudioCodecEnabled(userSettings.codecPreferences, codecId, enabled);
      if (!result.ok) {
        setCodecPreferencesError(mapCodecPreferenceMutationError(result.error));
        return;
      }
      setCodecPreferencesError(null);
      applyCodecPreferencesMutation({
        ...userSettings,
        codecPreferences: result.value,
      });
    },
    [applyCodecPreferencesMutation, userSettings],
  );

  const onVideoCodecEnabledChange = useCallback(
    (codecId: VideoCodecId, enabled: boolean): void => {
      const result = setVideoCodecEnabled(userSettings.codecPreferences, codecId, enabled);
      if (!result.ok) {
        setCodecPreferencesError(mapCodecPreferenceMutationError(result.error));
        return;
      }
      setCodecPreferencesError(null);
      applyCodecPreferencesMutation({
        ...userSettings,
        codecPreferences: result.value,
      });
    },
    [applyCodecPreferencesMutation, userSettings],
  );

  const onAudioCodecReorder = useCallback(
    (fromIndex: number, toIndex: number): void => {
      const result = reorderAudioCodecs(userSettings.codecPreferences, fromIndex, toIndex);
      if (!result.ok) {
        setCodecPreferencesError(mapCodecPreferenceMutationError(result.error));
        return;
      }
      setCodecPreferencesError(null);
      applyCodecPreferencesMutation({
        ...userSettings,
        codecPreferences: result.value,
      });
    },
    [applyCodecPreferencesMutation, userSettings],
  );

  const onVideoCodecReorder = useCallback(
    (fromIndex: number, toIndex: number): void => {
      const result = reorderVideoCodecs(userSettings.codecPreferences, fromIndex, toIndex);
      if (!result.ok) {
        setCodecPreferencesError(mapCodecPreferenceMutationError(result.error));
        return;
      }
      setCodecPreferencesError(null);
      applyCodecPreferencesMutation({
        ...userSettings,
        codecPreferences: result.value,
      });
    },
    [applyCodecPreferencesMutation, userSettings],
  );

  const onDismissUpdateBannerVersion = useCallback(
    (latestVersion: string): void => {
      persistUserSettings({
        ...userSettings,
        dismissedUpdateBannerVersion: latestVersion,
      });
    },
    [persistUserSettings, userSettings],
  );

  return {
    account,
    userSettings,
    onLanguageChange,
    onThemeChange,
    onMultiSessionsToggle,
    onAutoAnswerEnabledToggle,
    onAutoAnswerTimeoutChange,
    onAutoAnswerDuringActiveSessionToggle,
    onSipAutoReregisterToggle,
    onSipReregisterIntervalChange,
    onSipAutoReconnectToggle,
    onSipReconnectIntervalChange,
    onSipReconnectMaxAttemptsChange,
    onSipReregisterMaxAttemptsChange,
    onSipAutoRegisterOnStartupToggle,
    onDismissUpdateBannerVersion,
    onAudioCodecEnabledChange,
    onVideoCodecEnabledChange,
    onAudioCodecReorder,
    onVideoCodecReorder,
    codecPreferencesError,
    settingsUpdateError,
  };
}
