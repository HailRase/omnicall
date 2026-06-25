import type { JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { ConnectionOverlay } from "../components/recovery/ConnectionOverlay.js";
import { useConnectionRecoveryActions } from "../hooks/useConnectionRecoveryActions.js";
import { useConnectionRecoveryShell } from "../hooks/useConnectionRecoveryShell.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";

type RecoveryFeatureShellProps = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: compose connection recovery overlay from recovery projections.
 * - Inputs: account bootstrap facade.
 * - Outputs: recovery overlay when shell flags require it.
 */
export function RecoveryFeatureShell({ facade }: RecoveryFeatureShellProps): JSX.Element | null {
  const { connectionRecoveryProjection } = useSoftphoneProjections();
  const connectionRecoveryShell = useConnectionRecoveryShell(connectionRecoveryProjection);
  const connectionRecoveryActions = useConnectionRecoveryActions({
    facade,
    projection: connectionRecoveryProjection,
  });

  if (!connectionRecoveryShell.showOverlay) {
    return null;
  }

  return (
    <ConnectionOverlay
      connectionState={connectionRecoveryShell.connectionState}
      sipRecoveryMode={connectionRecoveryShell.sipRecoveryMode}
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
  );
}
