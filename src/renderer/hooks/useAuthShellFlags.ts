import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type AuthShellFlags = Readonly<{
  showAccountPanel: boolean;
  blockingAuthState: boolean;
}>;

/**
 * - Purpose: derive auth-related shell visibility flags from bootstrap projection.
 * - Inputs: account bootstrap projection from store selector.
 * - Outputs: panel visibility and blocking auth state flags.
 */
export function useAuthShellFlags(): AuthShellFlags {
  const projection = useAccountBootstrapStore((state) => state.projection);

  const showAccountPanel =
    projection.authUiState === "sip_only_ready" ||
    projection.authUiState === "sip_registration_failed" ||
    projection.authUiState === "sip_registered" ||
    projection.authUiState === "access_denied";

  const blockingAuthState =
    projection.authUiState === "booting" ||
    projection.authUiState === "ocp_authenticating" ||
    projection.authUiState === "ocp_session_exists" ||
    projection.authUiState === "ocp_invalid_token" ||
    projection.authUiState === "sip_registering";

  return { showAccountPanel, blockingAuthState };
}
