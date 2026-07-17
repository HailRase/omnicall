/**
 * - Purpose: bind OCP dual-FSM projection to System State OCP tab view-model (ADR-AF-005).
 * - Inputs: AccountBootstrapFacade, ocpIntegration.enabled from UserSettings.
 * - Outputs: derived OcpSystemStateShellView + recovery action callbacks (no SIP/Electron).
 */

import { useCallback, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveOcpSystemStateShell,
  type OcpRecoveryAction,
  type OcpSystemStateShellView,
} from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type UseOcpSystemStateShellInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  ocpModuleEnabled: boolean;
}>;

export type UseOcpSystemStateShellResult = Readonly<{
  shell: OcpSystemStateShellView;
  recoveryActionLoading: OcpRecoveryAction | null;
  onRecoveryAction: (action: OcpRecoveryAction) => void;
}>;

/**
 * - Purpose: derive System State OCP shell and wire dual-FSM recovery actions.
 */
export function useOcpSystemStateShell(
  input: UseOcpSystemStateShellInput,
): UseOcpSystemStateShellResult {
  const { facade, ocpModuleEnabled } = input;
  const serverState = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.serverState,
  );
  const authorizationState = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.authorizationState,
  );
  const connectionState = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.connectionState,
  );
  const [recoveryActionLoading, setRecoveryActionLoading] = useState<OcpRecoveryAction | null>(
    null,
  );

  const shell = useMemo(
    () =>
      deriveOcpSystemStateShell({
        dualFsm: {
          serverState,
          authorizationState,
          terminalSessionClosed: connectionState === "sessionClosed",
        },
        ocpModuleEnabled,
      }),
    [serverState, authorizationState, connectionState, ocpModuleEnabled],
  );

  const onRecoveryAction = useCallback(
    (action: OcpRecoveryAction): void => {
      if (facade === null || recoveryActionLoading !== null) {
        return;
      }
      if (!shell.allowedRecoveryActions.includes(action)) {
        return;
      }

      setRecoveryActionLoading(action);
      void facade
        .dispatchAccountRecoveryAction(action)
        .finally(() => {
          setRecoveryActionLoading(null);
        });
    },
    [facade, recoveryActionLoading, shell.allowedRecoveryActions],
  );

  return {
    shell,
    recoveryActionLoading,
    onRecoveryAction,
  };
}
