import type { JSX, ReactNode, RefObject } from "react";
import type {
  AppTheme,
  AudioCodecId,
  CodecPreferenceMutationMessageKey,
  CodecPreferences,
  NotificationPlacement,
  NotificationStacking,
  SipAccountInput,
  SipSystemStateShellView,
  SupportedLanguage,
  VideoCodecId,
} from "@application/index.js";
import type { SavedAccountProfileId } from "@application/index.js";
import type { SavedAccountProfileSelectorOption } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedProfilePanelMode } from "@application/projections/settings/deriveSavedProfilePanelMode.js";
import type { AccountAuthorizationErrorProjection } from "@application/projections/settings/mapAccountAuthorizationError.js";
import { IconButton } from "../ui/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsSectionId } from "./settingsSections.js";
import { resolveSettingsContentHeaderTitle } from "./settingsSections.js";
import type { TranslationKey } from "../../i18n/messages.js";
import { SettingsSidebar } from "./SettingsSidebar.js";
import { SettingsAccountPanel } from "./panels/SettingsAccountPanel.js";
import { SettingsCodecsPanel } from "./panels/SettingsCodecsPanel.js";
import { SettingsDiagnosticsPanel } from "./panels/SettingsDiagnosticsPanel.js";
import { SettingsGeneralPanel } from "./panels/SettingsGeneralPanel.js";
import { SettingsHeadsetPanel } from "./panels/SettingsHeadsetPanel.js";
import { SettingsSessionsPanel } from "./panels/SettingsSessionsPanel.js";
import { SettingsSystemStatePanel } from "./panels/SettingsSystemStatePanel.js";
import styles from "./SettingsPanel.module.css";

export type SettingsPanelProps = Readonly<{
  activeSection: SettingsSectionId;
  sidebarExpanded: boolean;
  isSipRegistered: boolean;
  onClose: () => void;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  onSidebarExpandedChange: (expanded: boolean) => void;
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  notificationPlacement: NotificationPlacement;
  onNotificationPlacementChange: (placement: NotificationPlacement) => void;
  notificationStacking: NotificationStacking;
  onNotificationStackingChange: (stacking: NotificationStacking) => void;
  notificationDurationMs: number;
  onNotificationDurationMsChange: (durationMs: number) => void;
  notificationMaxVisible: number;
  onNotificationMaxVisibleChange: (maxVisible: number) => void;
  multiSessionsEnabled: boolean;
  onMultiSessionsChange: (enabled: boolean) => void;
  autoAnswerEnabled: boolean;
  autoAnswerTimeoutSec: number;
  onAutoAnswerEnabledChange: (enabled: boolean) => void;
  onAutoAnswerTimeoutChange: (timeoutSec: number) => void;
  autoAnswerDuringActiveSessionEnabled: boolean;
  onAutoAnswerDuringActiveSessionChange: (enabled: boolean) => void;
  currentVersion: string;
  latestVersion: string | undefined;
  updateStatusMessage: string;
  canCheckForUpdates: boolean;
  canOpenDownloadPage: boolean;
  isCheckingUpdates: boolean;
  onCheckForUpdates: () => void;
  onOpenDownloadPage: () => void;
  systemState: Readonly<{
    shell: SipSystemStateShellView;
    sipAutoReconnectEnabled: boolean;
    onSipAutoReconnectChange: (enabled: boolean) => void;
    sipReconnectIntervalSec: number;
    onSipReconnectIntervalChange: (intervalSec: number) => void;
    sipReconnectMaxAttempts: number;
    onSipReconnectMaxAttemptsChange: (attempts: number) => void;
    sipAutoReregisterEnabled: boolean;
    onSipAutoReregisterChange: (enabled: boolean) => void;
    sipReregisterIntervalSec: number;
    onSipReregisterIntervalChange: (intervalSec: number) => void;
    sipReregisterMaxAttempts: number;
    onSipReregisterMaxAttemptsChange: (attempts: number) => void;
    sipAutoRegisterOnStartup: boolean;
    onSipAutoRegisterOnStartupChange: (enabled: boolean) => void;
    onManualTransportReconnect: () => void;
    onManualReregister: () => void;
    onClearJournal: () => void;
    actionLoading: "transport" | "reregister" | null;
  }>;
  codecPreferences: CodecPreferences;
  onAudioCodecEnabledChange: (codecId: AudioCodecId, enabled: boolean) => void;
  onVideoCodecEnabledChange: (codecId: VideoCodecId, enabled: boolean) => void;
  onAudioCodecReorder: (fromIndex: number, toIndex: number) => void;
  onVideoCodecReorder: (fromIndex: number, toIndex: number) => void;
  codecPreferencesError: CodecPreferenceMutationMessageKey | null;
  account: Readonly<{
    form: SipAccountInput;
    submitting: boolean;
    error: AccountAuthorizationErrorProjection | null;
    successKey: TranslationKey | null;
    warningKey: TranslationKey | null;
    panelMode: SavedProfilePanelMode;
    disabled: boolean;
    authorizeDisabledReason: string | null;
    logoutDisabledReason: string | null;
    savedProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
    selectedProfileId: SavedAccountProfileId | null;
    saveProfileChecked: boolean;
    saveProfileDisabled: boolean;
    saveProfileDisabledReasonKey: TranslationKey | null;
    rememberPasswordChecked: boolean;
    passwordFieldVisible: boolean;
    rememberPasswordVisible: boolean;
    forgetRememberedPasswordVisible: boolean;
    rememberPasswordDisabled: boolean;
    rememberPasswordDisabledReasonKey: TranslationKey | null;
    passwordHintKey: TranslationKey | null;
  deleteConfirmationOpen: boolean;
  switchConfirmationOpen: boolean;
  switchFromLogin: string;
  switchToLogin: string;
  passwordInputRef: RefObject<HTMLInputElement | null>;
    onFieldChange: (field: keyof SipAccountInput, value: string) => void;
    onSubmit: () => void;
    onLogout: () => void;
    onProfileSelect: (profileId: SavedAccountProfileId | null) => void;
    onSaveProfileChange: (checked: boolean) => void;
    onRememberPasswordChange: (checked: boolean) => void;
    onForgetRememberedPassword: () => void;
    onDeleteProfileRequest: (profileId: SavedAccountProfileId) => void;
  onDeleteProfileConfirm: () => void;
  onDeleteProfileCancel: () => void;
  onSwitchProfileConfirm: () => void;
  onSwitchProfileCancel: () => void;
}>;
}>;

/**
 * - Purpose: compose settings sidebar and section panels inside fullscreen overlay.
 * - Inputs: active section, sidebar state, settings and account callbacks.
 * - Outputs: sectioned settings layout without facade or repository access.
 * @uiMeta lf=LF-032,LF-076,LF-008 f=F-016,F-014,F-017 smoke=R7-5
 */
export function SettingsPanel({
  activeSection,
  sidebarExpanded,
  isSipRegistered,
  onClose,
  onSectionChange,
  onSidebarExpandedChange,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  notificationPlacement,
  onNotificationPlacementChange,
  notificationStacking,
  onNotificationStackingChange,
  notificationDurationMs,
  onNotificationDurationMsChange,
  notificationMaxVisible,
  onNotificationMaxVisibleChange,
  multiSessionsEnabled,
  onMultiSessionsChange,
  autoAnswerEnabled,
  autoAnswerTimeoutSec,
  onAutoAnswerEnabledChange,
  onAutoAnswerTimeoutChange,
  autoAnswerDuringActiveSessionEnabled,
  onAutoAnswerDuringActiveSessionChange,
  currentVersion,
  latestVersion,
  updateStatusMessage,
  canCheckForUpdates,
  canOpenDownloadPage,
  isCheckingUpdates,
  onCheckForUpdates,
  onOpenDownloadPage,
  systemState,
  codecPreferences,
  onAudioCodecEnabledChange,
  onVideoCodecEnabledChange,
  onAudioCodecReorder,
  onVideoCodecReorder,
  codecPreferencesError,
  account,
}: SettingsPanelProps): JSX.Element {
  const { t } = useI18n();
  const handleToggleSidebar = (): void => {
    onSidebarExpandedChange(!sidebarExpanded);
  };

  let sectionContent: ReactNode;
  switch (activeSection) {
    case "account":
      sectionContent = (
        <SettingsAccountPanel
          form={account.form}
          submitting={account.submitting}
          error={account.error}
          successKey={account.successKey}
          warningKey={account.warningKey}
          panelMode={account.panelMode}
          disabled={account.disabled}
          authorizeDisabledReason={account.authorizeDisabledReason}
          logoutDisabledReason={account.logoutDisabledReason}
          savedProfileOptions={account.savedProfileOptions}
          selectedProfileId={account.selectedProfileId}
          saveProfileChecked={account.saveProfileChecked}
          saveProfileDisabled={account.saveProfileDisabled}
          saveProfileDisabledReasonKey={account.saveProfileDisabledReasonKey}
          rememberPasswordChecked={account.rememberPasswordChecked}
          passwordFieldVisible={account.passwordFieldVisible}
          rememberPasswordVisible={account.rememberPasswordVisible}
          forgetRememberedPasswordVisible={account.forgetRememberedPasswordVisible}
          rememberPasswordDisabled={account.rememberPasswordDisabled}
          rememberPasswordDisabledReasonKey={account.rememberPasswordDisabledReasonKey}
          passwordHintKey={account.passwordHintKey}
          deleteConfirmationOpen={account.deleteConfirmationOpen}
          switchConfirmationOpen={account.switchConfirmationOpen}
          switchFromLogin={account.switchFromLogin}
          switchToLogin={account.switchToLogin}
          passwordInputRef={account.passwordInputRef}
          onFieldChange={account.onFieldChange}
          onSubmit={account.onSubmit}
          onLogout={account.onLogout}
          onProfileSelect={account.onProfileSelect}
          onSaveProfileChange={account.onSaveProfileChange}
          onRememberPasswordChange={account.onRememberPasswordChange}
          onForgetRememberedPassword={account.onForgetRememberedPassword}
          onDeleteProfileRequest={account.onDeleteProfileRequest}
          onDeleteProfileConfirm={account.onDeleteProfileConfirm}
          onDeleteProfileCancel={account.onDeleteProfileCancel}
          onSwitchProfileConfirm={account.onSwitchProfileConfirm}
          onSwitchProfileCancel={account.onSwitchProfileCancel}
        />
      );
      break;
    case "general":
      sectionContent = (
        <SettingsGeneralPanel
          theme={theme}
          language={language}
          onLanguageChange={onLanguageChange}
          onThemeChange={onThemeChange}
          notificationPlacement={notificationPlacement}
          onNotificationPlacementChange={onNotificationPlacementChange}
          notificationStacking={notificationStacking}
          onNotificationStackingChange={onNotificationStackingChange}
          notificationDurationMs={notificationDurationMs}
          onNotificationDurationMsChange={onNotificationDurationMsChange}
          notificationMaxVisible={notificationMaxVisible}
          onNotificationMaxVisibleChange={onNotificationMaxVisibleChange}
          currentVersion={currentVersion}
          latestVersion={latestVersion}
          updateStatusMessage={updateStatusMessage}
          canCheckForUpdates={canCheckForUpdates}
          canOpenDownloadPage={canOpenDownloadPage}
          isCheckingUpdates={isCheckingUpdates}
          onCheckForUpdates={onCheckForUpdates}
          onOpenDownloadPage={onOpenDownloadPage}
        />
      );
      break;
    case "sessions":
      sectionContent = (
        <SettingsSessionsPanel
          multiSessionsEnabled={multiSessionsEnabled}
          onMultiSessionsChange={onMultiSessionsChange}
          autoAnswerEnabled={autoAnswerEnabled}
          autoAnswerTimeoutSec={autoAnswerTimeoutSec}
          onAutoAnswerEnabledChange={onAutoAnswerEnabledChange}
          onAutoAnswerTimeoutChange={onAutoAnswerTimeoutChange}
          autoAnswerDuringActiveSessionEnabled={autoAnswerDuringActiveSessionEnabled}
          onAutoAnswerDuringActiveSessionChange={onAutoAnswerDuringActiveSessionChange}
        />
      );
      break;
    case "system-state":
      sectionContent = (
        <SettingsSystemStatePanel
          shell={systemState.shell}
          sipAutoReconnectEnabled={systemState.sipAutoReconnectEnabled}
          onSipAutoReconnectChange={systemState.onSipAutoReconnectChange}
          sipReconnectIntervalSec={systemState.sipReconnectIntervalSec}
          onSipReconnectIntervalChange={systemState.onSipReconnectIntervalChange}
          sipReconnectMaxAttempts={systemState.sipReconnectMaxAttempts}
          onSipReconnectMaxAttemptsChange={systemState.onSipReconnectMaxAttemptsChange}
          sipAutoReregisterEnabled={systemState.sipAutoReregisterEnabled}
          onSipAutoReregisterChange={systemState.onSipAutoReregisterChange}
          sipReregisterIntervalSec={systemState.sipReregisterIntervalSec}
          onSipReregisterIntervalChange={systemState.onSipReregisterIntervalChange}
          sipReregisterMaxAttempts={systemState.sipReregisterMaxAttempts}
          onSipReregisterMaxAttemptsChange={systemState.onSipReregisterMaxAttemptsChange}
          sipAutoRegisterOnStartup={systemState.sipAutoRegisterOnStartup}
          onSipAutoRegisterOnStartupChange={systemState.onSipAutoRegisterOnStartupChange}
          onManualTransportReconnect={systemState.onManualTransportReconnect}
          onManualReregister={systemState.onManualReregister}
          onClearJournal={systemState.onClearJournal}
          actionLoading={systemState.actionLoading}
        />
      );
      break;
    case "diagnostics":
      sectionContent = <SettingsDiagnosticsPanel />;
      break;
    case "codecs":
      sectionContent = (
        <SettingsCodecsPanel
          codecPreferences={codecPreferences}
          onAudioCodecEnabledChange={onAudioCodecEnabledChange}
          onVideoCodecEnabledChange={onVideoCodecEnabledChange}
          onAudioCodecReorder={onAudioCodecReorder}
          onVideoCodecReorder={onVideoCodecReorder}
          mutationErrorKey={codecPreferencesError}
        />
      );
      break;
    case "headset":
      sectionContent = <SettingsHeadsetPanel />;
      break;
    default: {
      const exhaustive: never = activeSection;
      throw new Error(`Unsupported settings section: ${String(exhaustive)}`);
    }
  }

  return (
    <div className={styles.layout} data-testid="settings-overlay-body">
      <SettingsSidebar
        activeSection={activeSection}
        expanded={sidebarExpanded}
        isSipRegistered={isSipRegistered}
        onSectionChange={onSectionChange}
        onToggleExpanded={handleToggleSidebar}
      />
      <div className={styles.content}>
        <header className={styles.contentHeader}>
          <h3 className={styles.contentTitle} data-testid="settings-section-title">
            {resolveSettingsContentHeaderTitle(t, activeSection)}
          </h3>
          <div className={styles.closeSlot}>
            <IconButton
              iconId="overlay.close"
              ariaLabel={t("settings.close")}
              data-testid="settings-overlay-close"
              variant="ghost"
              size="sm"
              className={styles.closeButton}
              onClick={onClose}
            />
          </div>
        </header>
        <div className={styles.contentBody}>{sectionContent}</div>
      </div>
    </div>
  );
}
