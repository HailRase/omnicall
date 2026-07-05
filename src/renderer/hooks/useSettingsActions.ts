import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";
import {
  createDefaultUserSettings,
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
  type AppTheme,
  type SupportedLanguage,
  type UserSettings,
} from "@application/index.js";
import { applyAppTheme } from "../theme/applyAppTheme.js";
import { DEFAULT_AUTO_ANSWER_TIMEOUT_SEC } from "../components/settings/panels/SettingsSessionsPanel.js";
import { setRendererLanguage, translateCurrent } from "../i18n/index.js";

type UseSettingsActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  currentSettings: MultiCallSettings;
  applyMultiCallSettings: (settings: MultiCallSettings) => void;
}>;

type UseSettingsActionsResult = Readonly<{
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

/**
 * - Purpose: bind settings overlay toggles to facade user settings (LF-032, LF-076, F-014).
 * - Inputs: facade, current multi-call settings, store projection applier.
 * - Outputs: settings callbacks and observable save errors.
 */
export function useSettingsActions(
  input: UseSettingsActionsInput,
): UseSettingsActionsResult {
  const { facade, currentSettings, applyMultiCallSettings } = input;
  const [settingsUpdateError, setSettingsUpdateError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(createDefaultUserSettings());

  useEffect(() => {
    if (facade === null) {
      return;
    }

    void facade.getUserSettingsForAccount().then((result) => {
      if (result.ok) {
        setUserSettings(result.value);
        setRendererLanguage(result.value.language);
        applyAppTheme(result.value.theme);
        syncNativeTheme(result.value.theme);
      }
    });
  }, [facade]);

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
          setUserSettings(result.value);
          setRendererLanguage(result.value.language);
          applyAppTheme(result.value.theme);
          syncNativeTheme(result.value.theme);
          applyMultiCallSettings({
            multiSessionsEnabled: result.value.multiSessionsEnabled,
            autoUnholdOnTransferFailure: result.value.autoUnholdOnTransferFailure,
          });
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
    settingsUpdateError,
  };
}
