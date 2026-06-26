import { useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { AuthStateView } from "../components/auth/AuthStateView.js";
import { OcpToastStack } from "../components/ocp/OcpToastStack.js";
import { SettingsFullscreenOverlay } from "../components/settings/SettingsFullscreenOverlay.js";
import { SettingsPanel } from "../components/settings/SettingsPanel.js";
import { useAccountActions } from "../hooks/useAccountActions.js";
import { useAccountPanelShell } from "../hooks/useAccountPanelShell.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useCallFeatureShell } from "../hooks/useCallFeatureShell.js";
import { useHeaderChromeShell } from "../hooks/useHeaderChromeShell.js";
import { useOcpNotifications } from "../hooks/useOcpNotifications.js";
import { useOverlayShell } from "../hooks/useOverlayShell.js";
import { useShellWindowLayout } from "../hooks/useShellWindowLayout.js";
import { useSettingsActions } from "../hooks/useSettingsActions.js";
import { useUserAvatarMenu } from "../hooks/useUserAvatarMenu.js";
import { useUserAvatarMenuActions } from "../hooks/useUserAvatarMenuActions.js";
import type { useSoftphoneShellChrome } from "../hooks/useSoftphoneShellChrome.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";
import { SoftphoneLayout } from "../widgets/SoftphoneLayout/SoftphoneLayout.js";
import { CallContextShell } from "./call/CallContextShell.js";
import { CallControlsShell } from "./call/CallControlsShell.js";
import { CallOverlayShell } from "./call/CallOverlayShell.js";
import { OperatorFeatureShell } from "./OperatorFeatureShell.js";
import { RecoveryFeatureShell } from "./RecoveryFeatureShell.js";
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
  const { connectionRecoveryShell, connectionRecoveryActions, sessionLogoutActions } =
    shellChrome;
  const { projection, ocpNotificationProjection, multiCallProjection, applyMultiCallSettings } =
    useSoftphoneProjections();
  const { blockingAuthState } = useAuthShellFlags();
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
  const headerChrome = useHeaderChromeShell();
  const userAvatarMenu = useUserAvatarMenu();
  const userAvatarMenuActions = useUserAvatarMenuActions({
    facade,
    phoneStatus: projection.phoneStatus,
    phoneStatusDisabled: blockingAuthState,
    isOcpMode: projection.isOcpMode,
    authUiState: projection.authUiState,
    sessionLogoutActions,
    onOpenSettings: overlayShell.openSettings,
    onMenuClose: userAvatarMenu.close,
  });
  const callBindings = useCallFeatureShell({ facade });
  const settingsActions = useSettingsActions({
    facade,
    currentSettings: {
      multiSessionsEnabled: multiCallProjection.multiSessionsEnabled,
      autoUnholdOnTransferFailure: multiCallProjection.autoUnholdOnTransferFailure,
    },
    applyMultiCallSettings,
  });

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
            connectionRecoveryShell={connectionRecoveryShell}
            connectionRecoveryActions={connectionRecoveryActions}
            userAvatarMenu={userAvatarMenu}
            userAvatarMenuActions={userAvatarMenuActions}
          />
          <OperatorFeatureShell facade={facade} />
        </>
      }
      context={
        <>
          <AuthStateView state={projection.authUiState} lastError={projection.lastError} />
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
          <RecoveryFeatureShell facade={facade} />
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
              sipAutoReregisterEnabled={settingsActions.userSettings.sipAutoReregisterEnabled}
              onSipAutoReregisterChange={settingsActions.onSipAutoReregisterToggle}
              sipReregisterIntervalSec={settingsActions.userSettings.sipReregisterIntervalSec}
              onSipReregisterIntervalChange={settingsActions.onSipReregisterIntervalChange}
              updateError={settingsActions.settingsUpdateError}
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
