import type { AuthUiState } from "@application/projections/settings/accountBootstrapProjection.js";
import type { SessionLogoutShellView } from "@application/projections/platform/deriveSessionLogoutShell.js";
import { translateCurrent } from "../i18n/index.js";

type MapAvatarMenuLogoutDisabledReasonInput = Readonly<{
  authUiState: AuthUiState;
  shell: SessionLogoutShellView;
}>;

/**
 * - Purpose: derive avatar menu logout disabled reason for always-visible exit item.
 * - Inputs: auth projection flags and session logout shell view.
 * - Outputs: localized disabled reason or null when logout is allowed.
 */
export function mapAvatarMenuLogoutDisabledReason(
  input: MapAvatarMenuLogoutDisabledReasonInput,
): string | null {
  const { shell, authUiState } = input;

  if (shell.endSessionDisabledReason !== null) {
    return translateCurrent(shell.endSessionDisabledReason);
  }

  if (shell.showEndSessionControl) {
    return null;
  }

  switch (authUiState) {
    case "sip_registering":
      return translateCurrent("header.userMenu.logoutDisabled.sipRegistering");
    case "sip_registration_failed":
      return translateCurrent("header.userMenu.logoutDisabled.sipRegistrationFailed");
    case "booting":
      return translateCurrent("header.userMenu.logoutDisabled.booting");
    case "sip_only_ready":
      return translateCurrent("header.userMenu.logoutDisabled.loginRequired");
    case "access_denied":
      return translateCurrent("header.userMenu.logoutDisabled.accessDenied");
    case "sip_registered":
      return null;
    default: {
      const exhaustive: never = authUiState;
      return exhaustive;
    }
  }
}
