import type { AuthUiState } from "@application/projections/accountBootstrapProjection.js";
import type { SessionLogoutShellView } from "@application/projections/deriveSessionLogoutShell.js";

type MapAvatarMenuLogoutDisabledReasonInput = Readonly<{
  isOcpMode: boolean;
  authUiState: AuthUiState;
  shell: SessionLogoutShellView;
}>;

/**
 * - Purpose: derive avatar menu logout disabled reason for always-visible exit item.
 * - Inputs: auth projection flags and session logout shell view.
 * - Outputs: Russian disabled reason or null when logout is allowed.
 */
export function mapAvatarMenuLogoutDisabledReason(
  input: MapAvatarMenuLogoutDisabledReasonInput,
): string | null {
  const { shell, isOcpMode, authUiState } = input;

  if (shell.endSessionDisabledReason !== null) {
    return shell.endSessionDisabledReason;
  }

  if (shell.showEndSessionControl) {
    return null;
  }

  if (isOcpMode) {
    return "Завершение SIP-сессии недоступно";
  }

  switch (authUiState) {
    case "sip_registering":
      return "Регистрация выполняется";
    case "sip_registration_failed":
      return "Регистрация не выполнена";
    case "booting":
      return "Приложение загружается";
    case "sip_only_ready":
      return "Сначала войдите в аккаунт";
    case "access_denied":
      return "Доступ запрещён";
    case "ocp_authenticating":
      return "Выполняется вход в OCP";
    case "ocp_session_exists":
    case "ocp_invalid_token":
      return "Выход недоступен в режиме OCP";
    case "sip_registered":
      return null;
    default: {
      const exhaustive: never = authUiState;
      return exhaustive;
    }
  }
}
