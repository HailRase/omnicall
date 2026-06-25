import { useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { pickSessionLogoutProjectionInput } from "@application/index.js";
import { useConnectionRecoveryActions } from "./useConnectionRecoveryActions.js";
import { useConnectionRecoveryShell } from "./useConnectionRecoveryShell.js";
import { useSessionLogoutActions } from "./useSessionLogoutActions.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

type UseSoftphoneShellChromeInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

/**
 * - Purpose: compose global shell chrome hooks (recovery header, session logout).
 * - Inputs: account bootstrap facade.
 * - Outputs: recovery shell/actions and session logout actions for App header.
 */
export function useSoftphoneShellChrome(input: UseSoftphoneShellChromeInput) {
  const { facade } = input;
  const {
    projection,
    multiCallProjection,
    incomingCallProjection,
    transferProjection,
    multiLineCallProjection,
    connectionRecoveryProjection,
  } = useSoftphoneProjections();

  const connectionRecoveryShell = useConnectionRecoveryShell(connectionRecoveryProjection);
  const connectionRecoveryActions = useConnectionRecoveryActions({
    facade,
    projection: connectionRecoveryProjection,
  });

  const sessionLogoutShellInput = useMemo(
    () =>
      pickSessionLogoutProjectionInput({
        isOcpMode: projection.isOcpMode,
        authUiState: projection.authUiState,
        multiCallProjection,
        incomingCallProjection,
        transferProjection,
        multiLineCallProjection,
      }),
    [
      projection.isOcpMode,
      projection.authUiState,
      multiCallProjection,
      incomingCallProjection,
      transferProjection,
      multiLineCallProjection,
    ],
  );

  const sessionLogoutActions = useSessionLogoutActions({
    facade,
    shellInput: sessionLogoutShellInput,
  });

  return {
    connectionRecoveryShell,
    connectionRecoveryActions,
    sessionLogoutActions,
  };
}
