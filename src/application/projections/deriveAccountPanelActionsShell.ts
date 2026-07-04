import type { SipAccountInput } from "@domain/index.js";
import type { AuthUiState } from "./accountBootstrapProjection.js";

export type AccountPanelActionsShellInput = Readonly<{
  authUiState: AuthUiState;
  form: SipAccountInput;
  submitting: boolean;
  panelDisabled: boolean;
  sessionLogoutDisabledReason: AccountPanelActionReasonKey | null;
}>;

export type AccountPanelActionsShell = Readonly<{
  authorizeDisabledReason: AccountPanelActionReasonKey | null;
  logoutDisabledReason: AccountPanelActionReasonKey | null;
}>;

export type AccountPanelActionReasonKey =
  | "account.actions.disabled.waitCurrentOperation"
  | "account.actions.disabled.authorizeInProgress"
  | "account.actions.disabled.alreadyAuthorized"
  | "account.actions.disabled.fillAndAuthorize"
  | "account.actions.disabled.authorizeFirst"
  | "session.logout.disabled.inProgress"
  | "session.logout.disabled.registrationInProgress";

function isFormEmpty(form: SipAccountInput): boolean {
  return (
    form.username.trim() === "" &&
    form.password.trim() === "" &&
    form.domain.trim() === "" &&
    form.server.trim() === ""
  );
}

/**
 * - Purpose: derive authorize/logout button disabled reasons for account settings panel.
 * - Inputs: auth state, form values, submit flags, session logout disabled reason.
 * - Outputs: Russian disabled reasons or null when the control is enabled.
 */
export function deriveAccountPanelActionsShell(
  input: AccountPanelActionsShellInput,
): AccountPanelActionsShell {
  const isAuthorized = input.authUiState === "sip_registered";

  let authorizeDisabledReason: AccountPanelActionReasonKey | null = null;
  if (input.panelDisabled) {
    authorizeDisabledReason = "account.actions.disabled.waitCurrentOperation";
  } else if (input.submitting) {
    authorizeDisabledReason = "account.actions.disabled.authorizeInProgress";
  } else if (isAuthorized) {
    authorizeDisabledReason = "account.actions.disabled.alreadyAuthorized";
  }

  let logoutDisabledReason: AccountPanelActionReasonKey | null = null;
  if (!isAuthorized) {
    logoutDisabledReason = isFormEmpty(input.form)
      ? "account.actions.disabled.fillAndAuthorize"
      : "account.actions.disabled.authorizeFirst";
  } else if (input.sessionLogoutDisabledReason !== null) {
    logoutDisabledReason = input.sessionLogoutDisabledReason;
  }

  return {
    authorizeDisabledReason,
    logoutDisabledReason,
  };
}
