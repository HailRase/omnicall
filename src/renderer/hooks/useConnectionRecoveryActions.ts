import { useCallback } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { ConnectionRecoveryProjection } from "@application/index.js";
import type { RetryConnectionChannel } from "@application/use-cases/RetryConnectionUseCase.js";

type UseConnectionRecoveryActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  projection: ConnectionRecoveryProjection;
}>;

type UseConnectionRecoveryActionsResult = Readonly<{
  onManualRetry: () => void;
  onSafeLogout: () => void;
  onReregisterSip: () => void;
}>;

/**
 * - Purpose: bind recovery overlay and shell controls to Use Cases (LF-009, LF-010, LF-048).
 * - Inputs: facade and connection recovery projection.
 * - Outputs: manual retry, safe logout, and SIP re-register callbacks.
 */
export function useConnectionRecoveryActions(
  input: UseConnectionRecoveryActionsInput,
): UseConnectionRecoveryActionsResult {
  const { facade, projection } = input;

  const onManualRetry = useCallback(() => {
    if (facade === null) {
      return;
    }

    const channel = resolveRetryChannel(projection);
    void facade.retryConnection.execute({ channel });
  }, [facade, projection]);

  const onReregisterSip = useCallback(() => {
    if (facade === null) {
      return;
    }

    void facade.reregisterSipAccount();
  }, [facade]);

  const onSafeLogout = useCallback(() => {
    if (facade === null) {
      return;
    }

    void facade.safeLogout.execute({});
  }, [facade]);

  return {
    onManualRetry,
    onSafeLogout,
    onReregisterSip,
  };
}

function resolveRetryChannel(
  projection: ConnectionRecoveryProjection,
): RetryConnectionChannel {
  const hasSipFailure = projection.sipReconnectAttempt !== null;
  const hasOcpFailure = projection.isOcpMode && projection.ocpReconnectAttempt !== null;

  if (hasSipFailure && hasOcpFailure) {
    return "both";
  }

  if (hasOcpFailure) {
    return "ocp";
  }

  return "sip";
}
