import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";
import { deriveActiveProfileSettingsSyncKey } from "@application/index.js";
import { deriveRegisteredAccountIdentity } from "@application/projections/settings/deriveRegisteredAccountIdentity.js";
import {
  MAX_NOTIFICATION_DURATION_MS,
  MAX_NOTIFICATION_MAX_VISIBLE,
  MIN_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_MAX_VISIBLE,
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
  type SessionViewMode,
  type SupportedLanguage,
  type NotificationRaiseWindowMode,
  type UserNotificationLevel,
  type UserNotificationModule,
  type UserSettings,
  type VideoCodecId,
} from "@application/index.js";
import { applyAppTheme } from "../theme/applyAppTheme.js";
import { DEFAULT_AUTO_ANSWER_TIMEOUT_SEC } from "../components/settings/panels/SettingsSessionsPanel.js";
import {
  applyNotificationPreferencesPreset,
  type NotificationPreferencesPresetId,
} from "../components/settings/panels/notificationPreferencesUi.js";
import { setRendererLanguage, translateCurrent } from "../i18n/index.js";
import { useAccountActions } from "./useAccountActions.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { HeadsetConnectionProjection } from "@application/projections/headset/headsetConnectionProjection.js";

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
  onNotificationPlacementChange: (
    placement: UserSettings["notificationPreferences"]["appearance"]["placement"],
  ) => void;
  onNotificationStackingChange: (
    stacking: UserSettings["notificationPreferences"]["appearance"]["stacking"],
  ) => void;
  onNotificationDurationMsChange: (durationMs: number) => void;
  onNotificationClosableChange: (closable: boolean) => void;
  onNotificationMaxVisibleChange: (maxVisible: number) => void;
  onMasterInAppPopupEnabledChange: (enabled: boolean) => void;
  onNotificationModuleEnabledChange: (
    module: UserNotificationModule,
    enabled: boolean,
  ) => void;
  onNotificationModuleMinLevelChange: (
    module: UserNotificationModule,
    minLevel: UserNotificationLevel,
  ) => void;
  onNotificationModuleRaiseWindowChange: (
    module: UserNotificationModule,
    raiseWindow: NotificationRaiseWindowMode,
  ) => void;
  onNotificationPreferencesPreset: (
    preset: NotificationPreferencesPresetId,
  ) => void;
  onMultiSessionsToggle: (enabled: boolean) => void;
  onAutoAnswerEnabledToggle: (enabled: boolean) => void;
  onAutoAnswerTimeoutChange: (timeoutSec: number) => void;
  onAutoAnswerDuringActiveSessionToggle: (enabled: boolean) => void;
  onIncomingRingtoneIdChange: (ringtoneId: UserSettings["incomingRingtoneId"]) => void;
  onPreviewIncomingRingtone: (ringtoneId: UserSettings["incomingRingtoneId"]) => void;
  onStopIncomingRingtonePreview: () => void;
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
  headsetEnabled: boolean;
  headsetAutoReconnect: boolean;
  preferredDeviceId: string | null;
  grantedDevices: ReadonlyArray<Readonly<{ id: string; productName: string }>>;
  onHeadsetEnabledChange: (enabled: boolean) => void;
  onHeadsetAutoReconnectChange: (enabled: boolean) => void;
  onConnectHeadset: (deviceId: string | null) => void;
  onDisconnectHeadset: () => void;
  headsetConnectionProjection: HeadsetConnectionProjection;
  preferredAudioInputDeviceId: string | null;
  preferredVideoInputDeviceId: string | null;
  defaultSessionView: SessionViewMode;
  autoFullscreenOnConference: boolean;
  conferenceNumberSubstring: string | null;
  enableLocalVideoAfterConnect: boolean;
  onPreferredAudioInputDeviceIdChange: (deviceId: string | null) => void;
  onPreferredVideoInputDeviceIdChange: (deviceId: string | null) => void;
  onDefaultSessionViewChange: (view: SessionViewMode) => void;
  onAutoFullscreenOnConferenceChange: (enabled: boolean) => void;
  onConferenceNumberSubstringChange: (value: string | null) => void;
  onEnableLocalVideoAfterConnectChange: (enabled: boolean) => void;
  onWindowAlwaysOnTopChange: (alwaysOnTop: boolean) => void;
  applyUserSettingsSnapshot: (settings: UserSettings) => void;
}>;

function resolveSettingsUpdateError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : translateCurrent("errors.settingsSaveFailed");
}

function syncNativeTheme(theme: AppTheme): void {
  void window.softphone.setNativeTheme({ theme });
}

function syncWindowAlwaysOnTop(alwaysOnTop: boolean): void {
  void window.softphone?.setWindowAlwaysOnTop({ alwaysOnTop });
}

function applyLoadedUserSettings(
  settings: UserSettings,
  applyMultiCallSettings: (settings: MultiCallSettings) => void,
): void {
  setRendererLanguage(settings.language);
  applyAppTheme(settings.theme);
  syncNativeTheme(settings.theme);
  syncWindowAlwaysOnTop(settings.windowAlwaysOnTop);
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
  const headsetConnectionProjection = useAccountBootstrapStore(
    (state) => state.headsetConnectionProjection,
  );
  const registeredIdentity = deriveRegisteredAccountIdentity(projection);
  const account = useAccountActions({ facade, isSipRegistered, registeredIdentity });
  const activeProfileSettingsSyncKey = useAccountBootstrapStore((state) =>
    deriveActiveProfileSettingsSyncKey(state.projection),
  );
  const [settingsUpdateError, setSettingsUpdateError] = useState<string | null>(null);
  const [grantedDevices, setGrantedDevices] = useState<
    ReadonlyArray<Readonly<{ id: string; productName: string }>>
  >([]);
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
        useAccountBootstrapStore.getState().syncHeadsetUserSettingsToProjection({
          headsetEnabled: result.value.headsetEnabled,
          headsetAutoReconnect: result.value.headsetAutoReconnect,
        });
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
          useAccountBootstrapStore.getState().syncHeadsetUserSettingsToProjection({
            headsetEnabled: result.value.headsetEnabled,
            headsetAutoReconnect: result.value.headsetAutoReconnect,
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

  const onNotificationPlacementChange = useCallback(
    (
      placement: UserSettings["notificationPreferences"]["appearance"]["placement"],
    ): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          appearance: {
            ...userSettings.notificationPreferences.appearance,
            placement,
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationStackingChange = useCallback(
    (
      stacking: UserSettings["notificationPreferences"]["appearance"]["stacking"],
    ): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          appearance: {
            ...userSettings.notificationPreferences.appearance,
            stacking,
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationDurationMsChange = useCallback(
    (notificationDurationMs: number): void => {
      const normalized = Math.min(
        MAX_NOTIFICATION_DURATION_MS,
        Math.max(MIN_NOTIFICATION_DURATION_MS, notificationDurationMs),
      );
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          appearance: {
            ...userSettings.notificationPreferences.appearance,
            durationMs: normalized,
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationClosableChange = useCallback(
    (closable: boolean): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          appearance: {
            ...userSettings.notificationPreferences.appearance,
            closable,
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationMaxVisibleChange = useCallback(
    (notificationMaxVisible: number): void => {
      const normalized = Math.min(
        MAX_NOTIFICATION_MAX_VISIBLE,
        Math.max(MIN_NOTIFICATION_MAX_VISIBLE, notificationMaxVisible),
      );
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          appearance: {
            ...userSettings.notificationPreferences.appearance,
            maxVisible: normalized,
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onMasterInAppPopupEnabledChange = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          masterInAppPopupEnabled: enabled,
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationModuleEnabledChange = useCallback(
    (module: UserNotificationModule, enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          modules: {
            ...userSettings.notificationPreferences.modules,
            [module]: {
              ...userSettings.notificationPreferences.modules[module],
              enabled,
            },
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationModuleMinLevelChange = useCallback(
    (module: UserNotificationModule, minLevel: UserNotificationLevel): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          modules: {
            ...userSettings.notificationPreferences.modules,
            [module]: {
              ...userSettings.notificationPreferences.modules[module],
              minLevel,
            },
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationModuleRaiseWindowChange = useCallback(
    (
      module: UserNotificationModule,
      raiseWindow: NotificationRaiseWindowMode,
    ): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          modules: {
            ...userSettings.notificationPreferences.modules,
            [module]: {
              ...userSettings.notificationPreferences.modules[module],
              raiseWindow,
            },
          },
        },
      });
    },
    [persistUserSettings, userSettings],
  );

  const onNotificationPreferencesPreset = useCallback(
    (preset: NotificationPreferencesPresetId): void => {
      persistUserSettings({
        ...userSettings,
        notificationPreferences: applyNotificationPreferencesPreset(
          userSettings.notificationPreferences,
          preset,
        ),
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

  const onIncomingRingtoneIdChange = useCallback(
    (ringtoneId: UserSettings["incomingRingtoneId"]): void => {
      persistUserSettings({
        ...userSettings,
        incomingRingtoneId: ringtoneId,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onPreviewIncomingRingtone = useCallback(
    (ringtoneId: UserSettings["incomingRingtoneId"]): void => {
      if (facade === null) {
        return;
      }
      void facade.previewIncomingRingtone(ringtoneId);
    },
    [facade],
  );

  const onStopIncomingRingtonePreview = useCallback((): void => {
    if (facade === null) {
      return;
    }
    void facade.stopIncomingRingtonePreview();
  }, [facade]);

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

  const onHeadsetEnabledChange = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        headsetEnabled: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onHeadsetAutoReconnectChange = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        headsetAutoReconnect: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const refreshGrantedHeadsetDevices = useCallback((): void => {
    if (facade === null) {
      setGrantedDevices([]);
      return;
    }
    void facade.listGrantedHeadsetDevices().then((devices) => {
      setGrantedDevices(devices);
    });
  }, [facade]);

  useEffect(() => {
    refreshGrantedHeadsetDevices();
  }, [
    refreshGrantedHeadsetDevices,
    headsetConnectionProjection.connectionState,
    headsetConnectionProjection.deviceId,
  ]);

  useEffect(() => {
    if (typeof window.softphone?.setHeadsetPreferredDeviceId !== "function") {
      return;
    }
    void window.softphone.setHeadsetPreferredDeviceId(
      userSettings.headsetPreferredDeviceId,
    );
  }, [userSettings.headsetPreferredDeviceId]);

  useEffect(() => {
    const connectedId = headsetConnectionProjection.deviceId;
    if (connectedId === null) {
      return;
    }
    setUserSettings((previous) =>
      previous.headsetPreferredDeviceId === connectedId
        ? previous
        : { ...previous, headsetPreferredDeviceId: connectedId },
    );
  }, [headsetConnectionProjection.deviceId]);

  const onConnectHeadset = useCallback(
    (deviceId: string | null): void => {
      if (facade === null) {
        return;
      }
      void facade.connectHeadsetDevice(deviceId).then(() => {
        refreshGrantedHeadsetDevices();
      });
    },
    [facade, refreshGrantedHeadsetDevices],
  );

  const onDisconnectHeadset = useCallback((): void => {
    if (facade === null) {
      return;
    }
    void facade.disconnectHeadsetDevice().then(() => {
      refreshGrantedHeadsetDevices();
    });
  }, [facade, refreshGrantedHeadsetDevices]);

  const onPreferredAudioInputDeviceIdChange = useCallback(
    (deviceId: string | null): void => {
      persistUserSettings({
        ...userSettings,
        preferredAudioInputDeviceId: deviceId,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onPreferredVideoInputDeviceIdChange = useCallback(
    (deviceId: string | null): void => {
      persistUserSettings({
        ...userSettings,
        preferredVideoInputDeviceId: deviceId,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onDefaultSessionViewChange = useCallback(
    (view: SessionViewMode): void => {
      persistUserSettings({
        ...userSettings,
        defaultSessionView: view,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onAutoFullscreenOnConferenceChange = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        autoFullscreenOnConference: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onConferenceNumberSubstringChange = useCallback(
    (value: string | null): void => {
      persistUserSettings({
        ...userSettings,
        conferenceNumberSubstring: value,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onEnableLocalVideoAfterConnectChange = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        enableLocalVideoAfterConnect: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onWindowAlwaysOnTopChange = useCallback(
    (alwaysOnTop: boolean): void => {
      if (userSettings.windowAlwaysOnTop === alwaysOnTop) {
        return;
      }
      persistUserSettings({
        ...userSettings,
        windowAlwaysOnTop: alwaysOnTop,
      });
    },
    [persistUserSettings, userSettings],
  );

  const applyUserSettingsSnapshot = useCallback(
    (settings: UserSettings): void => {
      setUserSettings(settings);
      applyLoadedUserSettings(settings, applyMultiCallSettings);
      useAccountBootstrapStore.getState().syncHeadsetUserSettingsToProjection({
        headsetEnabled: settings.headsetEnabled,
        headsetAutoReconnect: settings.headsetAutoReconnect,
      });
    },
    [applyMultiCallSettings],
  );

  return {
    account,
    userSettings,
    onLanguageChange,
    onThemeChange,
    onNotificationPlacementChange,
    onNotificationStackingChange,
    onNotificationDurationMsChange,
    onNotificationClosableChange,
    onNotificationMaxVisibleChange,
    onMasterInAppPopupEnabledChange,
    onNotificationModuleEnabledChange,
    onNotificationModuleMinLevelChange,
    onNotificationModuleRaiseWindowChange,
    onNotificationPreferencesPreset,
    onMultiSessionsToggle,
    onAutoAnswerEnabledToggle,
    onAutoAnswerTimeoutChange,
    onAutoAnswerDuringActiveSessionToggle,
    onIncomingRingtoneIdChange,
    onPreviewIncomingRingtone,
    onStopIncomingRingtonePreview,
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
    headsetEnabled: userSettings.headsetEnabled,
    headsetAutoReconnect: userSettings.headsetAutoReconnect,
    preferredDeviceId: userSettings.headsetPreferredDeviceId,
    grantedDevices,
    onHeadsetEnabledChange,
    onHeadsetAutoReconnectChange,
    onConnectHeadset,
    onDisconnectHeadset,
    headsetConnectionProjection,
    preferredAudioInputDeviceId: userSettings.preferredAudioInputDeviceId,
    preferredVideoInputDeviceId: userSettings.preferredVideoInputDeviceId,
    defaultSessionView: userSettings.defaultSessionView,
    autoFullscreenOnConference: userSettings.autoFullscreenOnConference,
    conferenceNumberSubstring: userSettings.conferenceNumberSubstring,
    enableLocalVideoAfterConnect: userSettings.enableLocalVideoAfterConnect,
    onPreferredAudioInputDeviceIdChange,
    onPreferredVideoInputDeviceIdChange,
    onDefaultSessionViewChange,
    onAutoFullscreenOnConferenceChange,
    onConferenceNumberSubstringChange,
    onEnableLocalVideoAfterConnectChange,
    onWindowAlwaysOnTopChange,
    applyUserSettingsSnapshot,
  };
}
