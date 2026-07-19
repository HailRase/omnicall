import type { JSX } from "react";
import { deriveAccountPanelActionsShell } from "@application/projections/settings/deriveAccountPanelActionsShell.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { AccountPanel } from "../components/account/AccountPanel.js";
import { useAccountActions } from "../hooks/useAccountActions.js";
import { useI18n } from "../i18n/index.js";

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
  const { t } = useI18n();
  const accountActions = useAccountActions({ facade });
  const accountPanelShell = deriveAccountPanelActionsShell({
    authUiState: "sip_only_ready",
    form: accountActions.form,
    submitting: accountActions.submitting,
    panelDisabled: disabled,
    sessionLogoutDisabledReason: null,
  });

  const authorizeDisabledReason =
    accountActions.loginDisabledReasonKey !== null
      ? t(accountActions.loginDisabledReasonKey)
      : accountPanelShell.authorizeDisabledReason === null
        ? null
        : t(accountPanelShell.authorizeDisabledReason);

  if (!visible) {
    return null;
  }

  return (
    <AccountPanel
      form={accountActions.form}
      ocpDraft={accountActions.ocpDraft}
      signInMode={accountActions.signInMode}
      submitting={accountActions.submitting}
      error={accountActions.error}
      successKey={accountActions.successKey}
      warningKey={accountActions.warningKey}
      authorizationProgress={accountActions.authorizationProgress}
      ocpSignInModalOpen={accountActions.ocpSignInModalOpen}
      onOcpSignInDisconnect={accountActions.handleOcpSignInDisconnect}
      onOcpSignInReconnect={accountActions.handleOcpSignInReconnect}
      onOcpSignInSuccessSettled={accountActions.handleOcpSignInSuccessSettled}
      panelMode="newFull"
      disabled={disabled}
      authorizeDisabledReason={authorizeDisabledReason}
      showOcpDomainField={accountActions.showOcpDomainField}
      showOcpApiKeyField={accountActions.showOcpApiKeyField}
      hasSavedOcpApiKey={accountActions.hasSavedOcpApiKey}
      allowedRecoveryActions={accountActions.allowedRecoveryActions}
      onRecoveryAction={accountActions.handleRecoveryAction}
      onFieldChange={accountActions.updateField}
      onOcpFieldChange={accountActions.updateOcpField}
      onSignInModeChange={accountActions.setSignInMode}
      onSubmit={accountActions.handleSubmit}
    />
  );
}
