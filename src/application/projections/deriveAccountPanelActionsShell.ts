import type { SipAccountInput } from "@domain/index.js";
import type { AuthUiState } from "./accountBootstrapProjection.js";

export type AccountPanelActionsShellInput = Readonly<{
  authUiState: AuthUiState;
  form: SipAccountInput;
  submitting: boolean;
  panelDisabled: boolean;
  sessionLogoutDisabledReason: string | null;
}>;

export type AccountPanelActionsShell = Readonly<{
  authorizeDisabledReason: string | null;
  logoutDisabledReason: string | null;
}>;

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

  let authorizeDisabledReason: string | null = null;
  if (input.panelDisabled) {
    authorizeDisabledReason = "Дождитесь завершения текущей операции";
  } else if (input.submitting) {
    authorizeDisabledReason = "Выполняется авторизация";
  } else if (isAuthorized) {
    authorizeDisabledReason = "Вы уже в сети. Для смены аккаунта нажмите «Выйти»";
  }

  let logoutDisabledReason: string | null = null;
  if (!isAuthorized) {
    logoutDisabledReason = isFormEmpty(input.form)
      ? "Заполните поля и нажмите «Авторизоваться»"
      : "Сначала нажмите «Авторизоваться»";
  } else if (input.sessionLogoutDisabledReason !== null) {
    logoutDisabledReason = input.sessionLogoutDisabledReason;
  }

  return {
    authorizeDisabledReason,
    logoutDisabledReason,
  };
}
