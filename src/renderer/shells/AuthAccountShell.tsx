import type { JSX } from "react";
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

  if (!visible) {
    return null;
  }

  return (
    <AccountPanel
      form={accountActions.form}
      submitting={accountActions.submitting}
      error={accountActions.error}
      disabled={disabled}
      onFieldChange={accountActions.updateField}
      onSubmit={accountActions.handleSubmit}
    />
  );
}
