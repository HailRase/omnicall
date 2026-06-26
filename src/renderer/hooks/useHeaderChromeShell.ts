import { useMemo } from "react";
import { deriveHeaderChromeShell } from "@application/index.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

/**
 * - Purpose: bind account bootstrap projection to header chrome view-model.
 * - Inputs: softphone store projections via useSoftphoneProjections.
 * - Outputs: header chrome shell view-model for presentational header components.
 */
export function useHeaderChromeShell() {
  const { projection, connectionRecoveryProjection } = useSoftphoneProjections();

  return useMemo(
    () =>
      deriveHeaderChromeShell({
        authUiState: projection.authUiState,
        registrationState: projection.registrationState,
        phoneStatus: projection.phoneStatus,
        agentId: projection.agentId,
        connectionState: connectionRecoveryProjection.connectionState,
        sipRecoveryMode: connectionRecoveryProjection.sipRecoveryMode,
      }),
    [
      projection.authUiState,
      projection.registrationState,
      projection.phoneStatus,
      projection.agentId,
      connectionRecoveryProjection.connectionState,
      connectionRecoveryProjection.sipRecoveryMode,
    ],
  );
}
