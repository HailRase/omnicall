import { useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { pickSessionLogoutProjectionInput } from "@application/index.js";
import { useSessionLogoutActions } from "./useSessionLogoutActions.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

type UseSoftphoneShellChromeInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

/**
 * - Purpose: compose global shell chrome hooks (session logout).
 * - Inputs: account bootstrap facade.
 * - Outputs: session logout actions for App header and account panel.
 */
export function useSoftphoneShellChrome(input: UseSoftphoneShellChromeInput) {
  const { facade } = input;
  const {
    projection,
    multiCallProjection,
    incomingCallProjection,
    transferProjection,
    multiLineCallProjection,
  } = useSoftphoneProjections();

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
    sessionLogoutActions,
  };
}
