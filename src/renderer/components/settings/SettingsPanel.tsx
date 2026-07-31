import type { JSX, ReactNode, RefObject } from "react";
import type {
  AppTheme,
  AudioCodecId,
  CodecPreferenceMutationMessageKey,
  CodecPreferences,
  NotificationPlacement,
  NotificationStacking,
  SessionViewMode,
  SettingsNavigationAvailability,
  SipAccountInput,
  OcpSystemStateShellView,
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
import type { HeadsetConnectionProjection } from "@application/projections/headset/headsetConnectionProjection.js";
import type { VideoSettingsDeviceOption } from "../../hooks/useVideoSettingsPanel.js";
import type { SettingsSectionId } from "./settingsSections.js";
import { resolveSettingsContentHeaderTitle } from "./settingsSections.js";
import type { TranslationKey } from "../../i18n/messages.js";
import type { AccountUiSignInMode, OcpDraftFields } from "../../hooks/accountActionsHelpers.js";
import type { OcpRecoveryAction } from "@application/index.js";
import { SettingsSidebar } from "./SettingsSidebar.js";
import { SettingsAccountPanel } from "./panels/SettingsAccountPanel.js";
import { SettingsCodecsPanel } from "./panels/SettingsCodecsPanel.js";
import { SettingsDiagnosticsPanel } from "./panels/SettingsDiagnosticsPanel.js";
import { SettingsGeneralPanel } from "./panels/SettingsGeneralPanel.js";
import { SettingsHeadsetPanel } from "./panels/SettingsHeadsetPanel.js";
import { SettingsSessionsPanel } from "./panels/SettingsSessionsPanel.js";
import { SettingsSystemStatePanel } from "./panels/SettingsSystemStatePanel.js";
import { SettingsVideoPanel } from "./panels/SettingsVideoPanel.js";
import { SettingsIntegrationsPanel } from "./panels/SettingsIntegrationsPanel.js";
import {
  SettingsNotificationHistoryPanel,
  type NotificationHistoryQuery,
} from "./panels/SettingsNotificationHistoryPanel.js";
import styles from "./SettingsPanel.module.css";
import type { OcpModuleSettingsCardProps } from "./panels/OcpModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./panels/SdkModuleSettingsCard.js";
import type { ExternalServicesPanelProps } from "./external-services/ExternalServicesPanel.js";
import type { ExternalApplicationsPanelProps } from "./external-applications/ExternalApplicationsPanel.js";

export type SettingsPanelProps = Readonly<{
  activeSection: SettingsSectionId;
  sidebarExpanded: boolean;
  sectionAvailability: SettingsNavigationAvailability;
  onClose: () => void;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  onSidebarExpandedChange: (expanded: boolean) => void;
  notificationHistoryQuery?: NotificationHistoryQuery;
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
  preferencesTransferBusy?: boolean;
  preferencesTransferStatusMessage?: string | null;
  onExportPreferences?: () => void;
  onImportPreferences?: () => void;
  systemState: Readonly<{
    shell: SipSystemStateShellView;
    ocpShell: OcpSystemStateShellView;
    ocpRecoveryActionLoading: OcpRecoveryAction | null;
    onOcpRecoveryAction: (action: OcpRecoveryAction) => void;
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
  headsetConnectionProjection: HeadsetConnectionProjection;
  headsetEnabled: boolean;
  headsetAutoReconnect: boolean;
  preferredDeviceId: string | null;
  grantedDevices: ReadonlyArray<Readonly<{ id: string; productName: string }>>;
  onHeadsetEnabledChange: (enabled: boolean) => void;
  onHeadsetAutoReconnectChange: (enabled: boolean) => void;
  onConnectHeadset: (deviceId: string | null) => void;
  onDisconnectHeadset: () => void;
  preferredAudioInputDeviceId: string | null;
  preferredVideoInputDeviceId: string | null;
  defaultSessionView: SessionViewMode;
  autoFullscreenOnConference: boolean;
  conferenceNumberSubstring: string | null;
  enableLocalVideoAfterConnect: boolean;
  videoAudioDevices: ReadonlyArray<VideoSettingsDeviceOption>;
  videoCameraDevices: ReadonlyArray<VideoSettingsDeviceOption>;
  videoDevicesLoading: boolean;
  videoDevicesError: boolean;
  videoPreviewError: boolean;
  videoPreviewRef: (element: HTMLVideoElement | null) => void;
  onPreferredAudioInputDeviceIdChange: (deviceId: string | null) => void;
  onPreferredVideoInputDeviceIdChange: (deviceId: string | null) => void;
  onDefaultSessionViewChange: (view: SessionViewMode) => void;
  onAutoFullscreenOnConferenceChange: (enabled: boolean) => void;
  onConferenceNumberSubstringChange: (value: string | null) => void;
  onEnableLocalVideoAfterConnectChange: (enabled: boolean) => void;
  onRefreshVideoDevices: () => void;
  integrations: Readonly<{
    ocp: OcpModuleSettingsCardProps;
    sdk: SdkModuleSettingsCardProps;
    externalServices: ExternalServicesPanelProps;
    externalApplications: ExternalApplicationsPanelProps;
  }>;
  account: Readonly<{
    form: SipAccountInput;
    ocpDraft: OcpDraftFields;
    signInMode: AccountUiSignInMode;
    submitting: boolean;
    error: AccountAuthorizationErrorProjection | null;
    successKey: TranslationKey | null;
    warningKey: TranslationKey | null;
    panelMode: SavedProfilePanelMode;
    disabled: boolean;
    authorizeDisabledReason: string | null;
    savedProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
    selectedProfileId: SavedAccountProfileId | null;
    saveProfileChecked: boolean;
    saveProfileDisabled: boolean;
    saveProfileDisabledReasonKey: TranslationKey | null;
    rememberPasswordChecked: boolean;
    passwordFieldVisible: boolean;
    rememberPasswordVisible: boolean;
    rememberPasswordDisabled: boolean;
    passwordHintKey: TranslationKey | null;
    showOcpDomainField: boolean;
    showOcpApiKeyField: boolean;
    hasSavedOcpApiKey: boolean;
    allowedRecoveryActions: ReadonlyArray<OcpRecoveryAction>;
    onRecoveryAction: (action: OcpRecoveryAction) => void;
    canForgetSavedSipPassword?: boolean;
    onForgetSavedSipPassword?: () => void;
    deleteConfirmationOpen: boolean;
    deleteSubmitting?: boolean;
    passwordInputRef: RefObject<HTMLInputElement | null>;
    onFieldChange: (field: keyof SipAccountInput, value: string) => void;
    onOcpFieldChange: (field: keyof OcpDraftFields, value: string) => void;
    onSignInModeChange: (mode: AccountUiSignInMode) => void;
    onSubmit: () => void;
    onProfileSelect: (profileId: SavedAccountProfileId | null) => void;
    onSaveProfileChange: (checked: boolean) => void;
    onRememberPasswordChange: (checked: boolean) => void;
    onDeleteProfileRequest: (profileId: SavedAccountProfileId) => void;
    onDeleteProfileConfirm: () => void;
    onDeleteProfileCancel: () => void;
    overwriteConfirmationOpen?: boolean;
    draftDiscardConfirmationOpen?: boolean;
    onDraftDiscardConfirm?: () => void;
    onDraftDiscardCancel?: () => void;
    onOverwriteCredentialsConfirm?: () => void;
    onOverwriteCredentialsContinue?: () => void;
    onOverwriteCredentialsCancel?: () => void;
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
  sectionAvailability,
  onClose,
  onSectionChange,
  onSidebarExpandedChange,
  notificationHistoryQuery,
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
  preferencesTransferBusy,
  preferencesTransferStatusMessage,
  onExportPreferences,
  onImportPreferences,
  systemState,
  codecPreferences,
  onAudioCodecEnabledChange,
  onVideoCodecEnabledChange,
  onAudioCodecReorder,
  onVideoCodecReorder,
  codecPreferencesError,
  headsetConnectionProjection,
  headsetEnabled,
  headsetAutoReconnect,
  preferredDeviceId,
  grantedDevices,
  onHeadsetEnabledChange,
  onHeadsetAutoReconnectChange,
  onConnectHeadset,
  onDisconnectHeadset,
  preferredAudioInputDeviceId,
  preferredVideoInputDeviceId,
  defaultSessionView,
  autoFullscreenOnConference,
  conferenceNumberSubstring,
  enableLocalVideoAfterConnect,
  videoAudioDevices,
  videoCameraDevices,
  videoDevicesLoading,
  videoDevicesError,
  videoPreviewError,
  videoPreviewRef,
  onPreferredAudioInputDeviceIdChange,
  onPreferredVideoInputDeviceIdChange,
  onDefaultSessionViewChange,
  onAutoFullscreenOnConferenceChange,
  onConferenceNumberSubstringChange,
  onEnableLocalVideoAfterConnectChange,
  onRefreshVideoDevices,
  integrations,
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
          ocpDraft={account.ocpDraft}
          signInMode={account.signInMode}
          submitting={account.submitting}
          error={account.error}
          successKey={account.successKey}
          warningKey={account.warningKey}
          panelMode={account.panelMode}
          disabled={account.disabled}
          authorizeDisabledReason={account.authorizeDisabledReason}
          savedProfileOptions={account.savedProfileOptions}
          selectedProfileId={account.selectedProfileId}
          saveProfileChecked={account.saveProfileChecked}
          saveProfileDisabled={account.saveProfileDisabled}
          saveProfileDisabledReasonKey={account.saveProfileDisabledReasonKey}
          rememberPasswordChecked={account.rememberPasswordChecked}
          passwordFieldVisible={account.passwordFieldVisible}
          rememberPasswordVisible={account.rememberPasswordVisible}
          rememberPasswordDisabled={account.rememberPasswordDisabled}
          passwordHintKey={account.passwordHintKey}
          showOcpDomainField={account.showOcpDomainField}
          showOcpApiKeyField={account.showOcpApiKeyField}
          hasSavedOcpApiKey={account.hasSavedOcpApiKey}
          allowedRecoveryActions={account.allowedRecoveryActions}
          onRecoveryAction={account.onRecoveryAction}
          canForgetSavedSipPassword={account.canForgetSavedSipPassword === true}
          {...(account.onForgetSavedSipPassword !== undefined
            ? { onForgetSavedSipPassword: account.onForgetSavedSipPassword }
            : {})}
          deleteConfirmationOpen={account.deleteConfirmationOpen}
          passwordInputRef={account.passwordInputRef}
          onFieldChange={account.onFieldChange}
          onOcpFieldChange={account.onOcpFieldChange}
          onSignInModeChange={account.onSignInModeChange}
          onSubmit={account.onSubmit}
          onProfileSelect={account.onProfileSelect}
          onSaveProfileChange={account.onSaveProfileChange}
          onRememberPasswordChange={account.onRememberPasswordChange}
          onDeleteProfileRequest={account.onDeleteProfileRequest}
          onDeleteProfileConfirm={account.onDeleteProfileConfirm}
          onDeleteProfileCancel={account.onDeleteProfileCancel}
          deleteSubmitting={account.deleteSubmitting ?? false}
          overwriteConfirmationOpen={account.overwriteConfirmationOpen ?? false}
          draftDiscardConfirmationOpen={
            account.draftDiscardConfirmationOpen ?? false
          }
          onDraftDiscardConfirm={
            account.onDraftDiscardConfirm ?? (() => undefined)
          }
          onDraftDiscardCancel={
            account.onDraftDiscardCancel ?? (() => undefined)
          }
          onOverwriteCredentialsConfirm={
            account.onOverwriteCredentialsConfirm ?? (() => undefined)
          }
          onOverwriteCredentialsContinue={
            account.onOverwriteCredentialsContinue ?? (() => undefined)
          }
          onOverwriteCredentialsCancel={
            account.onOverwriteCredentialsCancel ?? (() => undefined)
          }
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
          preferencesTransferBusy={preferencesTransferBusy}
          preferencesTransferStatusMessage={preferencesTransferStatusMessage}
          onExportPreferences={onExportPreferences}
          onImportPreferences={onImportPreferences}
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
          ocpShell={systemState.ocpShell}
          ocpRecoveryActionLoading={systemState.ocpRecoveryActionLoading}
          onOcpRecoveryAction={systemState.onOcpRecoveryAction}
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
    case "notifications":
      sectionContent =
        notificationHistoryQuery === undefined ? (
          <p>{t("settings.notifications.unavailable")}</p>
        ) : (
          <SettingsNotificationHistoryPanel query={notificationHistoryQuery} />
        );
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
    case "video":
      sectionContent = (
        <SettingsVideoPanel
          preferredAudioInputDeviceId={preferredAudioInputDeviceId}
          preferredVideoInputDeviceId={preferredVideoInputDeviceId}
          defaultSessionView={defaultSessionView}
          autoFullscreenOnConference={autoFullscreenOnConference}
          conferenceNumberSubstring={conferenceNumberSubstring}
          enableLocalVideoAfterConnect={enableLocalVideoAfterConnect}
          audioDevices={videoAudioDevices}
          videoDevices={videoCameraDevices}
          devicesLoading={videoDevicesLoading}
          devicesError={videoDevicesError}
          previewError={videoPreviewError}
          previewVideoRef={videoPreviewRef}
          onPreferredAudioInputDeviceIdChange={onPreferredAudioInputDeviceIdChange}
          onPreferredVideoInputDeviceIdChange={onPreferredVideoInputDeviceIdChange}
          onDefaultSessionViewChange={onDefaultSessionViewChange}
          onAutoFullscreenOnConferenceChange={onAutoFullscreenOnConferenceChange}
          onConferenceNumberSubstringChange={onConferenceNumberSubstringChange}
          onEnableLocalVideoAfterConnectChange={onEnableLocalVideoAfterConnectChange}
          onRefreshDevices={onRefreshVideoDevices}
        />
      );
      break;
    case "headset":
      sectionContent = (
        <SettingsHeadsetPanel
          projection={headsetConnectionProjection}
          headsetEnabled={headsetEnabled}
          headsetAutoReconnect={headsetAutoReconnect}
          preferredDeviceId={preferredDeviceId}
          grantedDevices={grantedDevices}
          onHeadsetEnabledChange={onHeadsetEnabledChange}
          onHeadsetAutoReconnectChange={onHeadsetAutoReconnectChange}
          onConnectHeadset={onConnectHeadset}
          onDisconnectHeadset={onDisconnectHeadset}
        />
      );
      break;
    case "integrations":
    case "integrations-external-services":
    case "integrations-external-applications":
    case "integrations-sdk":
      sectionContent = (
        <SettingsIntegrationsPanel
          sectionId={activeSection}
          ocp={integrations.ocp}
          sdk={integrations.sdk}
          externalServices={integrations.externalServices}
          externalApplications={integrations.externalApplications}
        />
      );
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
        sectionAvailability={sectionAvailability}
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
