import { useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { AccountPanelActionReasonKey } from "@application/index.js";
import { NotificationViewport } from "../components/notifications/NotificationViewport.js";
import { UpdateAvailableBanner } from "../components/updates/UpdateAvailableBanner.js";
import { SettingsFullscreenOverlay } from "../components/settings/SettingsFullscreenOverlay.js";
import { SettingsPanel } from "../components/settings/SettingsPanel.js";
import { DEFAULT_AUTO_ANSWER_TIMEOUT_SEC } from "../components/settings/panels/SettingsSessionsPanel.js";
import { mapAgentStatusRejectionReason } from "../helpers/mapAgentStatusRejectionReason.js";
import { useAccountPanelShell } from "../hooks/useAccountPanelShell.js";
import { useActionNotifications } from "../hooks/useActionNotifications.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useCallFeatureShell } from "../hooks/useCallFeatureShell.js";
import { useHeaderChromeShell } from "../hooks/useHeaderChromeShell.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { useOverlayShell } from "../hooks/useOverlayShell.js";
import { useShellWindowLayout } from "../hooks/useShellWindowLayout.js";
import { useShellWindowControls } from "../hooks/useShellWindowControls.js";
import { useAppUpdate } from "../hooks/useAppUpdate.js";
import { useSettingsActions } from "../hooks/useSettingsActions.js";
import {
  useSipSystemStateActions,
  useSipSystemStateShell,
} from "../hooks/useSipSystemStateActions.js";
import { useUserAvatarMenu } from "../hooks/useUserAvatarMenu.js";
import { useUserAvatarMenuActions } from "../hooks/useUserAvatarMenuActions.js";
import type { useSoftphoneShellChrome } from "../hooks/useSoftphoneShellChrome.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";
import { useI18n } from "../i18n/index.js";
import { SoftphoneLayout } from "../widgets/SoftphoneLayout/SoftphoneLayout.js";
import { CallContextShell } from "./call/CallContextShell.js";
import { CallControlsShell } from "./call/CallControlsShell.js";
import { CallOverlayShell } from "./call/CallOverlayShell.js";
import { OperatorFeatureShell } from "./OperatorFeatureShell.js";
import { SessionFeatureShell } from "./SessionFeatureShell.js";
import { SoftphoneShellHeader } from "./SoftphoneShellHeader.js";

type SoftphoneReadyShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  shellChrome: ReturnType<typeof useSoftphoneShellChrome>;
  isShuttingDown: boolean;
}>;

/**
 * - Purpose: compose post-bootstrap feature shells inside SoftphoneLayout zones.
 * - Inputs: account bootstrap facade and shared shell chrome hooks.
 * - Outputs: four-zone ready-state softphone UI tree.
 */
export function SoftphoneReadyShell({
  facade,
  shellChrome,
  isShuttingDown,
}: SoftphoneReadyShellProps): JSX.Element {
  const { t } = useI18n();
  const { sessionLogoutActions } = shellChrome;
  const {
    projection,
    operatorStatusProjection,
    ocpNotificationProjection,
    multiCallProjection,
    applyMultiCallSettings,
  } =
    useSoftphoneProjections();
  const { blockingAuthState, isSipRegistered } = useAuthShellFlags();
  const overlayShell = useOverlayShell();
  useShellWindowLayout({ settingsOpen: overlayShell.settingsOpen });
  const [settingsSidebarExpanded, setSettingsSidebarExpanded] = useState(false);
  const settingsActions = useSettingsActions({
    facade,
    currentSettings: {
      multiSessionsEnabled: multiCallProjection.multiSessionsEnabled,
      autoUnholdOnTransferFailure: multiCallProjection.autoUnholdOnTransferFailure,
    },
    applyMultiCallSettings,
    isSipRegistered,
  });
  const accountActions = settingsActions.account;
  const accountPanelShell = useAccountPanelShell({
    form: accountActions.form,
    submitting: accountActions.submitting,
    panelDisabled: blockingAuthState,
    authUiState: projection.authUiState,
    sessionLogoutActions,
    profileSwitchAllowed: accountActions.profileSwitchAllowed,
  });
  const translateAccountActionReason = (
    reasonKey: AccountPanelActionReasonKey | null,
  ): string | null => (reasonKey === null ? null : t(reasonKey));
  const sipSystemStateActions = useSipSystemStateActions({ facade });
  const sipSystemStateShell = useSipSystemStateShell({
    userSettings: settingsActions.userSettings,
    journalEntries: sipSystemStateActions.journalEntries,
  });
  const headerChrome = useHeaderChromeShell({
    dndEnabled: projection.phoneStatus === "dnd",
    sipAutoReconnectEnabled: settingsActions.userSettings.sipAutoReconnectEnabled,
    sipAutoReregisterEnabled: settingsActions.userSettings.sipAutoReregisterEnabled,
  });
  const userAvatarMenu = useUserAvatarMenu();
  const userAvatarMenuActions = useUserAvatarMenuActions({
    facade,
    phoneStatus: projection.phoneStatus,
    phoneStatusDisabled: blockingAuthState,
    isSipRegistered,
    isOcpMode: projection.isOcpMode,
    authUiState: projection.authUiState,
    sessionLogoutActions,
    onOpenSettings: overlayShell.openSettings,
    onMenuClose: userAvatarMenu.close,
  });
  const callBindings = useCallFeatureShell({ facade });
  const appUpdate = useAppUpdate({
    backgroundCheckOnMount: true,
    dismissedUpdateBannerVersion: settingsActions.userSettings.dismissedUpdateBannerVersion,
    onDismissUpdateBannerVersion: settingsActions.onDismissUpdateBannerVersion,
  });
  const notifications = useNotifications({
    placement: settingsActions.userSettings.notificationPlacement,
    stacking: settingsActions.userSettings.notificationStacking,
    durationMs: settingsActions.userSettings.notificationDurationMs,
    closable: settingsActions.userSettings.notificationClosable,
    maxVisible: settingsActions.userSettings.notificationMaxVisible,
  });
  const sipActionErrorText =
    sipSystemStateActions.actionErrorDetail ??
    (sipSystemStateActions.actionErrorKey !== null ? t(sipSystemStateActions.actionErrorKey) : null);
  const statusRejectionBanner = mapAgentStatusRejectionReason(
    operatorStatusProjection.lastRejectionReason,
  );
  useActionNotifications({
    notifications,
    accountFeedback: {
      error: accountActions.error,
      successKey: accountActions.successKey,
      warningKey: accountActions.warningKey,
    },
    callControls: {
      projection: callBindings.activeCallControlsProjection,
      onRetry: callBindings.callActions.handleRetryLastOperation,
    },
    dtmfError: callBindings.callProjection.lastDtmfError,
    transferFailure: callBindings.transferPanelShell.failureMessage,
    logoutErrorMessage: sessionLogoutActions.shell.logoutErrorMessage,
    settingsUpdateError: settingsActions.settingsUpdateError,
    sipActionSuccessKey: sipSystemStateActions.actionSuccessKey,
    sipActionErrorText,
    statusRejectionBanner,
    ocpToasts:
      projection.isOcpMode && ocpNotificationProjection.isOcpSyncAvailable
        ? ocpNotificationProjection.toasts
        : [],
  });
  const windowControls = useShellWindowControls({ isShuttingDown });

  return (
    <SoftphoneLayout
      header={
        <>
          <SoftphoneShellHeader
            headerChrome={headerChrome}
            userAvatarMenu={userAvatarMenu}
            userAvatarMenuActions={userAvatarMenuActions}
            windowControls={windowControls}
            suppressWindowControls={overlayShell.settingsOpen}
          />
          <OperatorFeatureShell facade={facade} />
        </>
      }
      context={
        <>
          <SessionFeatureShell sessionLogoutActions={sessionLogoutActions} />
          <CallContextShell bindings={callBindings} />
        </>
      }
      controls={<CallControlsShell bindings={callBindings} />}
      overlays={
        <>
          <UpdateAvailableBanner
            visible={appUpdate.showUpdatePrompt}
            latestVersion={appUpdate.snapshot.latestVersion}
            onDownload={appUpdate.onOpenDownloadPage}
            onDismiss={appUpdate.onDismissUpdatePrompt}
          />
          <NotificationViewport
            placement={notifications.placement}
            stacking={notifications.stacking}
            durationMs={notifications.durationMs}
            closable={notifications.closable}
            maxVisible={notifications.maxVisible}
            items={notifications.items}
            onDismiss={notifications.dismiss}
          />
          <CallOverlayShell bindings={callBindings} />
          <SettingsFullscreenOverlay
            open={overlayShell.settingsOpen}
            onClose={overlayShell.closeOverlay}
            windowControls={windowControls}
          >
            <SettingsPanel
              activeSection={overlayShell.settingsSection}
              sidebarExpanded={settingsSidebarExpanded}
              onClose={overlayShell.closeOverlay}
              onSectionChange={overlayShell.setSettingsSection}
              onSidebarExpandedChange={setSettingsSidebarExpanded}
              language={settingsActions.userSettings.language}
              onLanguageChange={settingsActions.onLanguageChange}
              theme={settingsActions.userSettings.theme}
              onThemeChange={settingsActions.onThemeChange}
              notificationPlacement={settingsActions.userSettings.notificationPlacement}
              onNotificationPlacementChange={settingsActions.onNotificationPlacementChange}
              notificationStacking={settingsActions.userSettings.notificationStacking}
              onNotificationStackingChange={settingsActions.onNotificationStackingChange}
              notificationDurationMs={settingsActions.userSettings.notificationDurationMs}
              onNotificationDurationMsChange={settingsActions.onNotificationDurationMsChange}
              notificationClosable={settingsActions.userSettings.notificationClosable}
              onNotificationClosableChange={settingsActions.onNotificationClosableChange}
              notificationMaxVisible={settingsActions.userSettings.notificationMaxVisible}
              onNotificationMaxVisibleChange={settingsActions.onNotificationMaxVisibleChange}
              multiSessionsEnabled={multiCallProjection.multiSessionsEnabled}
              onMultiSessionsChange={settingsActions.onMultiSessionsToggle}
              autoAnswerEnabled={settingsActions.userSettings.autoAnswerTimeoutSec !== null}
              autoAnswerTimeoutSec={
                settingsActions.userSettings.autoAnswerTimeoutSec ??
                DEFAULT_AUTO_ANSWER_TIMEOUT_SEC
              }
              onAutoAnswerEnabledChange={settingsActions.onAutoAnswerEnabledToggle}
              onAutoAnswerTimeoutChange={settingsActions.onAutoAnswerTimeoutChange}
              autoAnswerDuringActiveSessionEnabled={
                settingsActions.userSettings.autoAnswerDuringActiveSessionEnabled
              }
              onAutoAnswerDuringActiveSessionChange={
                settingsActions.onAutoAnswerDuringActiveSessionToggle
              }
              currentVersion={appUpdate.snapshot.currentVersion}
              latestVersion={appUpdate.snapshot.latestVersion}
              updateStatusMessage={appUpdate.statusMessage}
              canCheckForUpdates={appUpdate.canCheckForUpdates}
              canOpenDownloadPage={appUpdate.canOpenDownloadPage}
              isCheckingUpdates={appUpdate.isChecking}
              onCheckForUpdates={appUpdate.onCheckForUpdates}
              onOpenDownloadPage={appUpdate.onOpenDownloadPage}
              systemState={{
                shell: sipSystemStateShell,
                sipAutoReconnectEnabled: settingsActions.userSettings.sipAutoReconnectEnabled,
                onSipAutoReconnectChange: settingsActions.onSipAutoReconnectToggle,
                sipReconnectIntervalSec: settingsActions.userSettings.sipReconnectIntervalSec,
                onSipReconnectIntervalChange: settingsActions.onSipReconnectIntervalChange,
                sipReconnectMaxAttempts: settingsActions.userSettings.sipReconnectMaxAttempts,
                onSipReconnectMaxAttemptsChange: settingsActions.onSipReconnectMaxAttemptsChange,
                sipAutoReregisterEnabled: settingsActions.userSettings.sipAutoReregisterEnabled,
                onSipAutoReregisterChange: settingsActions.onSipAutoReregisterToggle,
                sipReregisterIntervalSec: settingsActions.userSettings.sipReregisterIntervalSec,
                onSipReregisterIntervalChange: settingsActions.onSipReregisterIntervalChange,
                sipReregisterMaxAttempts: settingsActions.userSettings.sipReregisterMaxAttempts,
                onSipReregisterMaxAttemptsChange:
                  settingsActions.onSipReregisterMaxAttemptsChange,
                sipAutoRegisterOnStartup: settingsActions.userSettings.sipAutoRegisterOnStartup,
                onSipAutoRegisterOnStartupChange:
                  settingsActions.onSipAutoRegisterOnStartupToggle,
                onManualTransportReconnect: sipSystemStateActions.onManualTransportReconnect,
                onManualReregister: sipSystemStateActions.onManualReregister,
                onClearJournal: sipSystemStateActions.onClearJournal,
                actionLoading: sipSystemStateActions.actionLoading,
              }}
              codecPreferences={settingsActions.userSettings.codecPreferences}
              onAudioCodecEnabledChange={settingsActions.onAudioCodecEnabledChange}
              onVideoCodecEnabledChange={settingsActions.onVideoCodecEnabledChange}
              onAudioCodecReorder={settingsActions.onAudioCodecReorder}
              onVideoCodecReorder={settingsActions.onVideoCodecReorder}
              codecPreferencesError={settingsActions.codecPreferencesError}
              account={{
                form: accountActions.form,
                submitting: accountActions.submitting,
                error: accountActions.error,
                successKey: accountActions.successKey,
                warningKey: accountActions.warningKey,
                panelMode: accountActions.panelMode,
                disabled: blockingAuthState,
                authorizeDisabledReason: translateAccountActionReason(
                  accountPanelShell.authorizeDisabledReason,
                ),
                logoutDisabledReason: translateAccountActionReason(
                  accountPanelShell.logoutDisabledReason,
                ),
                savedProfileOptions: accountActions.savedProfileOptions,
                selectedProfileId: accountActions.selectedProfileId,
                saveProfileChecked: accountActions.saveProfileChecked,
                saveProfileDisabled: accountActions.saveProfileDisabled,
                saveProfileDisabledReasonKey: accountActions.saveProfileDisabledReasonKey,
                passwordHintKey: accountActions.passwordHintKey,
                deleteConfirmationOpen: accountActions.deleteConfirmationOpen,
                switchConfirmationOpen: accountActions.switchConfirmationOpen,
                switchFromLogin: accountActions.switchFromLogin,
                switchToLogin: accountActions.switchToLogin,
                passwordInputRef: accountActions.passwordInputRef,
                onFieldChange: accountActions.updateField,
                onSubmit: accountActions.handleSubmit,
                onLogout: sessionLogoutActions.handleEndSession,
                onProfileSelect: accountActions.selectProfile,
                onSaveProfileChange: accountActions.setSaveProfileChecked,
                onDeleteProfileRequest: accountActions.requestDeleteSelectedProfile,
                onDeleteProfileConfirm: accountActions.confirmDeleteSelectedProfile,
                onDeleteProfileCancel: accountActions.cancelDeleteSelectedProfile,
                onSwitchProfileConfirm: accountActions.confirmSwitchProfile,
                onSwitchProfileCancel: accountActions.cancelSwitchProfile,
              }}
            />
          </SettingsFullscreenOverlay>
        </>
      }
    />
  );
}
