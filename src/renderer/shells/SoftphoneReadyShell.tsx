import { type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { AuthStateView } from "../components/auth/AuthStateView.js";
import { PhoneStatusBadge } from "../components/status/PhoneStatusBadge.js";
import { OcpToastStack } from "../components/ocp/OcpToastStack.js";
import { ConnectionOverlay } from "../components/recovery/ConnectionOverlay.js";
import { LogoutActiveSessionConfirmationModal } from "../components/session/LogoutActiveSessionConfirmationModal.js";
import { registrationLabel } from "../helpers/registrationLabel.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useConnectionRecoveryShell } from "../hooks/useConnectionRecoveryShell.js";
import { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import { useOcpNotifications } from "../hooks/useOcpNotifications.js";
import { usePhoneStatusActions } from "../hooks/usePhoneStatusActions.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { AuthAccountShell } from "./AuthAccountShell.js";
import { CallFeatureShell } from "./CallFeatureShell.js";
import { OperatorFeatureShell } from "./OperatorFeatureShell.js";

type SoftphoneReadyShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  sessionLogoutActions: UseSessionLogoutActionsResult;
}>;

/**
 * - Purpose: compose all post-bootstrap feature shells and global overlays.
 * - Inputs: account bootstrap facade.
 * - Outputs: ready-state softphone UI tree.
 */
export function SoftphoneReadyShell({
  facade,
  sessionLogoutActions,
}: SoftphoneReadyShellProps): JSX.Element {
  const projection = useAccountBootstrapStore((state) => state.projection);
  const callProjection = useAccountBootstrapStore((state) => state.callProjection);
  const activeCallControlsProjection = useAccountBootstrapStore(
    (state) => state.activeCallControlsProjection,
  );
  const incomingCallProjection = useAccountBootstrapStore(
    (state) => state.incomingCallProjection,
  );
  const queueInfoProjection = useAccountBootstrapStore(
    (state) => state.queueInfoProjection,
  );
  const campaignProjection = useAccountBootstrapStore(
    (state) => state.campaignProjection,
  );
  const ocpNotificationProjection = useAccountBootstrapStore(
    (state) => state.ocpNotificationProjection,
  );
  const multiCallProjection = useAccountBootstrapStore(
    (state) => state.multiCallProjection,
  );
  const transferProjection = useAccountBootstrapStore((state) => state.transferProjection);
  const multiLineCallProjection = useAccountBootstrapStore(
    (state) => state.multiLineCallProjection,
  );
  const operatorStatusProjection = useAccountBootstrapStore(
    (state) => state.operatorStatusProjection,
  );
  const connectionRecoveryProjection = useAccountBootstrapStore(
    (state) => state.connectionRecoveryProjection,
  );
  const setCallMode = useAccountBootstrapStore((state) => state.setCallMode);
  const setIncomingUiState = useAccountBootstrapStore((state) => state.setIncomingUiState);
  const setIncomingBreakReason = useAccountBootstrapStore(
    (state) => state.setIncomingBreakReason,
  );
  const setIncomingRejectReasonRequired = useAccountBootstrapStore(
    (state) => state.setIncomingRejectReasonRequired,
  );

  const { showAccountPanel, blockingAuthState } = useAuthShellFlags();
  const phoneStatusActions = usePhoneStatusActions({ facade, disabled: blockingAuthState });
  const connectionRecoveryShell = useConnectionRecoveryShell(connectionRecoveryProjection);
  const connectionRecoveryActions = useConnectionRecoveryActions({
    facade,
    projection: connectionRecoveryProjection,
  });

  const ocpNotifications = useOcpNotifications({
    isOcpMode: projection.isOcpMode,
    ocpNotificationProjection,
  });

  return (
    <>
      <OcpToastStack
        toasts={ocpNotifications.visibleToasts}
        onDismiss={ocpNotifications.dismissToast}
      />

      {connectionRecoveryShell.showOverlay && (
        <ConnectionOverlay
          connectionState={connectionRecoveryShell.connectionState}
          isBlocking={connectionRecoveryShell.isBlocking}
          showOcpRow={connectionRecoveryShell.showOcpRow}
          showSipRow={connectionRecoveryShell.showSipRow}
          ocpReconnectAttempt={connectionRecoveryShell.ocpReconnectAttempt}
          sipReconnectAttempt={connectionRecoveryShell.sipReconnectAttempt}
          ocpMaxAttempts={connectionRecoveryShell.ocpMaxAttempts}
          sipMaxAttempts={connectionRecoveryShell.sipMaxAttempts}
          reconnectCountdownSeconds={connectionRecoveryShell.reconnectCountdownSeconds}
          lastFailureReason={connectionRecoveryShell.lastFailureReason}
          retryDisabledReason={connectionRecoveryShell.retryDisabledReason}
          safeLogoutDisabledReason={connectionRecoveryShell.safeLogoutDisabledReason}
          onManualRetry={connectionRecoveryActions.onManualRetry}
          onSafeLogout={connectionRecoveryActions.onSafeLogout}
        />
      )}

      <AuthStateView state={projection.authUiState} lastError={projection.lastError} />

      {sessionLogoutActions.shell.showLogoutErrorBanner && (
        <p className="shell__error" role="alert" data-testid="logout-error-banner">
          {sessionLogoutActions.shell.logoutErrorMessage}
          <button
            type="button"
            aria-label="Retry end session"
            onClick={sessionLogoutActions.handleRetryLogout}
          >
            Retry
          </button>
        </p>
      )}

      <LogoutActiveSessionConfirmationModal
        open={sessionLogoutActions.confirmationModalOpen}
        onConfirm={sessionLogoutActions.handleConfirmLogout}
        onCancel={sessionLogoutActions.handleCancelLogout}
      />

      <PhoneStatusBadge
        status={projection.phoneStatus}
        registrationLabel={registrationLabel(
          projection.registrationState,
          projection.authUiState,
        )}
        disabled={blockingAuthState}
        onChange={phoneStatusActions.handlePhoneStatusChange}
      />

      <OperatorFeatureShell
        facade={facade}
        projection={projection}
        operatorStatusProjection={operatorStatusProjection}
      />

      <AuthAccountShell
        facade={facade}
        visible={showAccountPanel && !blockingAuthState}
        disabled={false}
      />

      <CallFeatureShell
        facade={facade}
        projection={projection}
        callProjection={callProjection}
        activeCallControlsProjection={activeCallControlsProjection}
        incomingCallProjection={incomingCallProjection}
        queueInfoProjection={queueInfoProjection}
        campaignProjection={campaignProjection}
        multiCallProjection={multiCallProjection}
        transferProjection={transferProjection}
        multiLineCallProjection={multiLineCallProjection}
        operatorStatusProjection={operatorStatusProjection}
        setCallMode={setCallMode}
        setIncomingUiState={setIncomingUiState}
        setIncomingBreakReason={setIncomingBreakReason}
        setIncomingRejectReasonRequired={setIncomingRejectReasonRequired}
      />
    </>
  );
}
