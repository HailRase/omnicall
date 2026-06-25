import type { JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { AuthStateView } from "../components/auth/AuthStateView.js";
import { PhoneStatusBadge } from "../components/status/PhoneStatusBadge.js";
import { OcpToastStack } from "../components/ocp/OcpToastStack.js";
import { ShellOverlaySheet } from "../components/shell/ShellOverlaySheet.js";
import { SettingsOverlay } from "../components/settings/SettingsOverlay.js";
import { registrationLabel } from "../helpers/registrationLabel.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useCallFeatureShell } from "../hooks/useCallFeatureShell.js";
import { useHeaderChromeShell } from "../hooks/useHeaderChromeShell.js";
import { useOcpNotifications } from "../hooks/useOcpNotifications.js";
import { useOverlayShell } from "../hooks/useOverlayShell.js";
import { usePhoneStatusActions } from "../hooks/usePhoneStatusActions.js";
import { useSettingsActions } from "../hooks/useSettingsActions.js";
import type { useSoftphoneShellChrome } from "../hooks/useSoftphoneShellChrome.js";
import { useShellCollapse } from "../hooks/useShellCollapse.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";
import { SoftphoneLayout } from "../widgets/SoftphoneLayout/SoftphoneLayout.js";
import { AuthAccountShell } from "./AuthAccountShell.js";
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
  const { showAccountPanel, blockingAuthState } = useAuthShellFlags();
  const phoneStatusActions = usePhoneStatusActions({ facade, disabled: blockingAuthState });
  const overlayShell = useOverlayShell();
  const { collapsed, toggleCollapsed } = useShellCollapse();
  const headerChrome = useHeaderChromeShell();
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
      collapsed={collapsed}
      header={
        <>
          <SoftphoneShellHeader
            headerChrome={headerChrome}
            collapsed={collapsed}
            connectionRecoveryShell={connectionRecoveryShell}
            connectionRecoveryActions={connectionRecoveryActions}
            sessionLogoutActions={sessionLogoutActions}
            onToggleCollapse={toggleCollapsed}
            onOpenSettings={overlayShell.openSettings}
            onOpenDiagnostics={overlayShell.openDiagnostics}
          />
          {!collapsed ? (
            <>
              <PhoneStatusBadge
                status={projection.phoneStatus}
                registrationLabel={registrationLabel(
                  projection.registrationState,
                  projection.authUiState,
                )}
                disabled={blockingAuthState}
                onChange={phoneStatusActions.handlePhoneStatusChange}
              />
              <OperatorFeatureShell facade={facade} />
            </>
          ) : null}
        </>
      }
      context={
        <>
          {!collapsed ? (
            <>
              <AuthStateView state={projection.authUiState} lastError={projection.lastError} />
              <SessionFeatureShell sessionLogoutActions={sessionLogoutActions} />
              <AuthAccountShell
                facade={facade}
                visible={showAccountPanel && !blockingAuthState}
                disabled={false}
              />
            </>
          ) : null}
          <CallContextShell bindings={callBindings} collapsed={collapsed} />
        </>
      }
      controls={collapsed ? null : <CallControlsShell bindings={callBindings} />}
      overlays={
        <>
          <OcpToastStack
            toasts={ocpNotifications.visibleToasts}
            onDismiss={ocpNotifications.dismissToast}
          />
          <RecoveryFeatureShell facade={facade} />
          <CallOverlayShell bindings={callBindings} />
          <ShellOverlaySheet
            open={overlayShell.settingsOpen}
            title="Settings"
            testId="settings-overlay"
            onClose={overlayShell.closeOverlay}
          >
            <SettingsOverlay
              multiSessionsEnabled={multiCallProjection.multiSessionsEnabled}
              onMultiSessionsChange={settingsActions.onMultiSessionsToggle}
              updateError={settingsActions.settingsUpdateError}
            />
          </ShellOverlaySheet>
          <ShellOverlaySheet
            open={overlayShell.diagnosticsOpen}
            title="Diagnostics"
            testId="diagnostics-overlay"
            onClose={overlayShell.closeOverlay}
          />
        </>
      }
    />
  );
}
