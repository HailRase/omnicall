import { useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { OcpToastStack } from "../components/ocp/OcpToastStack.js";
import { SettingsFullscreenOverlay } from "../components/settings/SettingsFullscreenOverlay.js";
import { SettingsPanel } from "../components/settings/SettingsPanel.js";
import { DEFAULT_AUTO_ANSWER_TIMEOUT_SEC } from "../components/settings/panels/SettingsSessionsPanel.js";
import { useAccountActions } from "../hooks/useAccountActions.js";
import { useAccountPanelShell } from "../hooks/useAccountPanelShell.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useCallFeatureShell } from "../hooks/useCallFeatureShell.js";
import { useHeaderChromeShell } from "../hooks/useHeaderChromeShell.js";
import { useOcpNotifications } from "../hooks/useOcpNotifications.js";
import { useOverlayShell } from "../hooks/useOverlayShell.js";
import { useShellWindowLayout } from "../hooks/useShellWindowLayout.js";
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
}>;

/**
 * - Purpose: compose post-bootstrap feature shells inside SoftphoneLayout zones.
 * - Inputs: account bootstrap facade and shared shell chrome hooks.
 * - Outputs: four-zone ready-state softphone UI tree.
 */
export function SoftphoneReadyShell({
  facade,
  shellChrome,
}: SoftphoneReadyShellProps): JSX.Element {
  const { sessionLogoutActions } = shellChrome;
  const { projection, ocpNotificationProjection, multiCallProjection, applyMultiCallSettings } =
    useSoftphoneProjections();
  const { blockingAuthState, isSipRegistered } = useAuthShellFlags();
  const overlayShell = useOverlayShell();
  useShellWindowLayout({ settingsOpen: overlayShell.settingsOpen });
  const accountActions = useAccountActions({ facade });
  const accountPanelShell = useAccountPanelShell({
    form: accountActions.form,
    submitting: accountActions.submitting,
    panelDisabled: blockingAuthState,
    authUiState: projection.authUiState,
    sessionLogoutActions,
  });
  const [settingsSidebarExpanded, setSettingsSidebarExpanded] = useState(false);
  const settingsActions = useSettingsActions({
    facade,
    currentSettings: {
      multiSessionsEnabled: multiCallProjection.multiSessionsEnabled,
      autoUnholdOnTransferFailure: multiCallProjection.autoUnholdOnTransferFailure,
    },
    applyMultiCallSettings,
  });
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
  const appUpdate = useAppUpdate();

  const ocpNotifications = useOcpNotifications({
    isOcpMode: projection.isOcpMode,
    ocpNotificationProjection,
  });

  return (
    <SoftphoneLayout
      header={
        <>
          <SoftphoneShellHeader
            headerChrome={headerChrome}
            userAvatarMenu={userAvatarMenu}
            userAvatarMenuActions={userAvatarMenuActions}
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
          <OcpToastStack
            toasts={ocpNotifications.visibleToasts}
            onDismiss={ocpNotifications.dismissToast}
          />
          <CallOverlayShell bindings={callBindings} />
          <SettingsFullscreenOverlay
            open={overlayShell.settingsOpen}
            onClose={overlayShell.closeOverlay}
          >
            <SettingsPanel
              activeSection={overlayShell.settingsSection}
              sidebarExpanded={settingsSidebarExpanded}
              onClose={overlayShell.closeOverlay}
              onSectionChange={overlayShell.setSettingsSection}
              onSidebarExpandedChange={setSettingsSidebarExpanded}
              theme={settingsActions.userSettings.theme}
              onThemeChange={settingsActions.onThemeChange}
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
              updateError={settingsActions.settingsUpdateError}
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
                actionError: sipSystemStateActions.actionError,
                actionSuccess: sipSystemStateActions.actionSuccess,
                actionLoading: sipSystemStateActions.actionLoading,
              }}
              account={{
                form: accountActions.form,
                submitting: accountActions.submitting,
                error: accountActions.error,
                disabled: blockingAuthState,
                authorizeDisabledReason: accountPanelShell.authorizeDisabledReason,
                logoutDisabledReason: accountPanelShell.logoutDisabledReason,
                onFieldChange: accountActions.updateField,
                onSubmit: accountActions.handleSubmit,
                onLogout: sessionLogoutActions.handleEndSession,
              }}
            />
          </SettingsFullscreenOverlay>
        </>
      }
    />
  );
}
