import type { JSX, ReactNode } from "react";
import type {
  AppTheme,
  AudioCodecId,
  CodecPreferenceMutationMessageKey,
  CodecPreferences,
  SipAccountInput,
  SipSystemStateShellView,
  SupportedLanguage,
  VideoCodecId,
} from "@application/index.js";
import { IconControlButton } from "../icons/index.js";
import { useI18n } from "../../i18n/index.js";
import type { SettingsSectionId } from "./settingsSections.js";
import { resolveSettingsContentHeaderTitle } from "./settingsSections.js";
import type { SipManualActionSuccessKey } from "../../hooks/useSipSystemStateActions.js";
import type { TranslationKey } from "../../i18n/messages.js";
import { SettingsSidebar } from "./SettingsSidebar.js";
import { SettingsAccountPanel } from "./panels/SettingsAccountPanel.js";
import { SettingsCodecsPanel } from "./panels/SettingsCodecsPanel.js";
import { SettingsDiagnosticsPanel } from "./panels/SettingsDiagnosticsPanel.js";
import { SettingsGeneralPanel } from "./panels/SettingsGeneralPanel.js";
import { SettingsHeadsetPanel } from "./panels/SettingsHeadsetPanel.js";
import { SettingsSessionsPanel } from "./panels/SettingsSessionsPanel.js";
import { SettingsSystemStatePanel } from "./panels/SettingsSystemStatePanel.js";
import formStyles from "./SettingsForm.module.css";
import styles from "./SettingsPanel.module.css";

export type SettingsPanelProps = Readonly<{
  activeSection: SettingsSectionId;
  sidebarExpanded: boolean;
  onClose: () => void;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  onSidebarExpandedChange: (expanded: boolean) => void;
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
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
  updateError?: string | null;
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
    actionErrorKey: TranslationKey | null;
    actionErrorDetail: string | null;
    actionSuccessKey: SipManualActionSuccessKey | null;
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
    error: string | null;
    successKey: TranslationKey | null;
    disabled: boolean;
    authorizeDisabledReason: string | null;
    logoutDisabledReason: string | null;
    onFieldChange: (field: keyof SipAccountInput, value: string) => void;
    onSubmit: () => void;
    onLogout: () => void;
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
  onClose,
  onSectionChange,
  onSidebarExpandedChange,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
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
  updateError = null,
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
          disabled={account.disabled}
          authorizeDisabledReason={account.authorizeDisabledReason}
          logoutDisabledReason={account.logoutDisabledReason}
          onFieldChange={account.onFieldChange}
          onSubmit={account.onSubmit}
          onLogout={account.onLogout}
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
          actionErrorKey={systemState.actionErrorKey}
          actionErrorDetail={systemState.actionErrorDetail}
          actionSuccessKey={systemState.actionSuccessKey}
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
        onSectionChange={onSectionChange}
        onToggleExpanded={handleToggleSidebar}
      />
      <div className={styles.content}>
        <header className={styles.contentHeader}>
          <h3 className={styles.contentTitle} data-testid="settings-section-title">
            {resolveSettingsContentHeaderTitle(t, activeSection)}
          </h3>
          <div className={styles.closeSlot}>
            <IconControlButton
              iconId="overlay.close"
              ariaLabel={t("settings.close")}
              testId="settings-overlay-close"
              className={styles.closeButton}
              onClick={onClose}
            />
          </div>
        </header>
        {updateError !== null ? (
          <p className={formStyles.error} role="alert" data-testid="settings-update-error">
            {updateError}
          </p>
        ) : null}
        <div className={styles.contentBody}>{sectionContent}</div>
      </div>
    </div>
  );
}
