import type { AuthUiState } from "@application/projections/settings/accountBootstrapProjection.js";
import { translateCurrent } from "../i18n/index.js";

type MapAvatarMenuShellNavigationDisabledReasonInput = Readonly<{
  isSipRegistered: boolean;
  authUiState: AuthUiState;
}>;

/**
 * - Purpose: derive disabled reason for contacts/history avatar menu entries.
 * - Inputs: SIP registration flag and auth UI state from bootstrap projection.
 * - Outputs: localized disabled reason or null when shell navigation is allowed.
 */
export function mapAvatarMenuShellNavigationDisabledReason(
  input: MapAvatarMenuShellNavigationDisabledReasonInput,
): string | null {
  if (input.isSipRegistered) {
    return null;
  }

  if (input.authUiState === "sip_only_ready") {
    return translateCurrent("header.userMenu.navigationDisabled.loginRequired");
  }

  return translateCurrent("header.userMenu.navigationDisabled.notRegistered");
}
