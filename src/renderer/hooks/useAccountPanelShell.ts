import { useMemo } from "react";
import {
  deriveAccountPanelActionsShell,
  type AccountPanelActionsShell,
} from "@application/projections/settings/deriveAccountPanelActionsShell.js";
import type { AuthUiState } from "@application/projections/settings/accountBootstrapProjection.js";
import type { SipAccountInput } from "@application/index.js";
import type { UseSessionLogoutActionsResult } from "./useSessionLogoutActions.js";

type UseAccountPanelShellInput = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  panelDisabled: boolean;
  authUiState: AuthUiState;
  sessionLogoutActions: UseSessionLogoutActionsResult;
}>;

/**
 * - Purpose: derive account settings authorize/logout button shell from projections.
 * - Inputs: account form state, auth projection, session logout shell.
 * - Outputs: disabled reasons for authorize and logout controls.
 */
export function useAccountPanelShell(
  input: UseAccountPanelShellInput,
): AccountPanelActionsShell {
  const {
    form,
    submitting,
    panelDisabled,
    authUiState,
    sessionLogoutActions,
  } = input;

  return useMemo(
    () =>
      deriveAccountPanelActionsShell({
        authUiState,
        form,
        submitting,
        panelDisabled,
        sessionLogoutDisabledReason:
          authUiState === "sip_registered"
            ? sessionLogoutActions.shell.endSessionDisabledReason
            : null,
      }),
    [
      authUiState,
      form,
      panelDisabled,
      sessionLogoutActions.shell.endSessionDisabledReason,
      submitting,
    ],
  );
}
