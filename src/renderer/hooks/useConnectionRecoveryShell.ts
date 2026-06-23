import { useMemo } from "react";
import {
  deriveConnectionRecoveryShell,
  type ConnectionRecoveryProjection,
} from "@application/index.js";
import { useReconnectCountdown } from "./useReconnectCountdown.js";

export type ConnectionRecoveryShellResult = ReturnType<typeof deriveConnectionRecoveryShell> &
  Readonly<{
    connectionState: ConnectionRecoveryProjection["connectionState"];
    reconnectCountdownSeconds: number | null;
    lastFailureReason: string | null;
    ocpReconnectAttempt: number | null;
    sipReconnectAttempt: number | null;
    nextRetryAt: string | null;
    isOcpMode: boolean;
  }>;

/**
 * - Purpose: compose connection recovery overlay props from store projection (LF-057).
 * - Inputs: connection recovery projection from store.
 * - Outputs: overlay visibility, channel rows, countdown, disabled reasons.
 */
export function useConnectionRecoveryShell(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryShellResult {
  const shell = useMemo(() => deriveConnectionRecoveryShell(projection), [projection]);

  const reconnectCountdownSeconds = useReconnectCountdown(
    projection.nextRetryAt,
    projection.connectionState,
  );

  return {
    ...shell,
    connectionState: projection.connectionState,
    reconnectCountdownSeconds,
    lastFailureReason: projection.lastFailureReason,
    ocpReconnectAttempt: projection.ocpReconnectAttempt,
    sipReconnectAttempt: projection.sipReconnectAttempt,
    nextRetryAt: projection.nextRetryAt,
    isOcpMode: projection.isOcpMode,
  };
}
