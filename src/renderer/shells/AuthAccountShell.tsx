import type { JSX } from "react";
import { deriveAccountPanelActionsShell } from "@application/projections/deriveAccountPanelActionsShell.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { AccountPanel } from "../components/account/AccountPanel.js";
import { useAccountActions } from "../hooks/useAccountActions.js";

type AuthAccountShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  visible: boolean;
  disabled: boolean;
}>;

/**
 * - Purpose: compose account authorization panel with account actions hook.
 * - Inputs: facade, visibility, and disabled flags from auth shell.
 * - Outputs: presentational account panel when visible.
 */
export function AuthAccountShell({
  facade,
  visible,
  disabled,
}: AuthAccountShellProps): JSX.Element | null {
  const accountActions = useAccountActions({ facade });
  const accountPanelShell = deriveAccountPanelActionsShell({
    authUiState: "sip_only_ready",
    form: accountActions.form,
    submitting: accountActions.submitting,
    panelDisabled: disabled,
    sessionLogoutDisabledReason: null,
  });

  if (!visible) {
    return null;
  }

  return (
    <AccountPanel
      form={accountActions.form}
      submitting={accountActions.submitting}
      error={accountActions.error}
      successKey={accountActions.successKey}
      disabled={disabled}
      authorizeDisabledReason={accountPanelShell.authorizeDisabledReason}
      logoutDisabledReason={accountPanelShell.logoutDisabledReason}
      onFieldChange={accountActions.updateField}
      onSubmit={accountActions.handleSubmit}
      onLogout={() => undefined}
    />
  );
}
